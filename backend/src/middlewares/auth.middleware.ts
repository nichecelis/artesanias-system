import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';

import { env } from '../config/env';
import { redis, redisKeys } from '../config/redis';
import { AppError, AuthPayload, AuthRequest } from '../types';

// ─── Verificar JWT ────────────────────────────────────────────

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Token de autenticación requerido');
    }

    const token = authHeader.slice(7);

    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {
      throw new AppError(401, 'Token inválido o expirado');
    }

    // Verificar si el token fue invalidado (logout)
    const isBlacklisted = await redis.get(redisKeys.blacklistToken(payload.jti));
    if (isBlacklisted) {
      throw new AppError(401, 'Token inválido');
    }

    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

// ─── Autorización por roles ───────────────────────────────────

export function authorize(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return next(new AppError(401, 'No autenticado'));
    }

    if (roles.length > 0 && !roles.includes(user.rol)) {
      return next(
        new AppError(403, `Acceso denegado. Roles permitidos: ${roles.join(', ')}`),
      );
    }

    next();
  };
}

// Alias conveniente: solo administrador
export const soloAdmin = authorize(Rol.ADMINISTRADOR);
