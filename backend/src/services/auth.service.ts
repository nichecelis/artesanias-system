import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../config/database';
import { redis, redisKeys } from '../config/redis';
import { env } from '../config/env';
import { AppError, AuthPayload } from '../types';

interface LoginDto {
  correo: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {

  // ─── Login ──────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<TokenPair & { usuario: { id: string; nombre: string; rol: string } }> {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: dto.correo.toLowerCase().trim() },
      select: {
        id: true, nombre: true, correo: true,
        passwordHash: true, rol: true, activo: true,
      },
    });

    // Usar tiempo constante para evitar user enumeration (OWASP)
    const passwordValida = usuario
      ? await bcrypt.compare(dto.password, usuario.passwordHash)
      : await bcrypt.compare(dto.password, '$2b$12$fakeHashParaEvitarTimingAttack');

    if (!usuario || !passwordValida || !usuario.activo) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const tokens = await this.generarTokens(usuario.id, usuario.correo, usuario.rol);

    return {
      ...tokens,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    };
  }

  // ─── Renovar access token con refresh token ─────────────────
  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: AuthPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
    } catch {
      throw new AppError(401, 'Refresh token inválido o expirado');
    }

    // Verificar que el refresh token existe en Redis
    const storedToken = await redis.get(
      redisKeys.refreshToken(payload.sub, payload.jti),
    );
    if (!storedToken) {
      throw new AppError(401, 'Refresh token inválido');
    }

    // Verificar usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, correo: true, rol: true, activo: true },
    });

    if (!usuario || !usuario.activo) {
      throw new AppError(401, 'Usuario inactivo');
    }

    // Rotar: eliminar refresh token viejo y crear par nuevo
    await redis.del(redisKeys.refreshToken(payload.sub, payload.jti));
    return this.generarTokens(usuario.id, usuario.correo, usuario.rol);
  }

  // ─── Logout: invalidar tokens ────────────────────────────────
  async logout(userId: string, jti: string, accessTokenExp: number): Promise<void> {
    const ttl = accessTokenExp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(redisKeys.blacklistToken(jti), ttl, '1');
    }
    // Eliminar todos los refresh tokens del usuario
    const pattern = redisKeys.refreshToken(userId, '*');
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  }

  // ─── Generar par de tokens ────────────────────────────────────
  private async generarTokens(
    userId: string,
    correo: string,
    rol: string,
  ): Promise<TokenPair> {
    const jti = uuidv4();
    const refreshJti = uuidv4();
    const EXPIRES_IN = 15 * 60; // 15 minutos en segundos

    const accessToken = jwt.sign(
      { sub: userId, correo, rol, jti } satisfies Partial<AuthPayload>,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    const refreshToken = jwt.sign(
      { sub: userId, correo, rol, jti: refreshJti } satisfies Partial<AuthPayload>,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
    );

    // Guardar refresh token en Redis (7 días = 604800 segundos)
    await redis.setex(
      redisKeys.refreshToken(userId, refreshJti),
      604800,
      refreshToken,
    );

    return { accessToken, refreshToken, expiresIn: EXPIRES_IN };
  }
}

export const authService = new AuthService();
