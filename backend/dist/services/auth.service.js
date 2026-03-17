"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const env_1 = require("../config/env");
const types_1 = require("../types");
class AuthService {
    async login(dto) {
        const usuario = await database_1.prisma.usuario.findUnique({
            where: { correo: dto.correo.toLowerCase().trim() },
            select: {
                id: true,
                nombre: true,
                correo: true,
                passwordHash: true,
                rol: true,
                activo: true,
            },
        });
        const passwordValida = usuario
            ? await bcryptjs_1.default.compare(dto.password, usuario.passwordHash)
            : await bcryptjs_1.default.compare(dto.password, '$2b$12$fakeHashParaEvitarTimingAttack');
        if (!usuario || !passwordValida || !usuario.activo) {
            throw new types_1.AppError('Correo o contraseña incorrectos', 401);
        }
        const tokens = await this.generarTokens(usuario.id, usuario.correo, usuario.rol);
        return {
            ...tokens,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol,
            },
        };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
        }
        catch {
            throw new types_1.AppError('Refresh token inválido o expirado', 401);
        }
        // Verificar que el refresh token existe en Redis
        const storedToken = await redis_1.redis.get(redis_1.redisKeys.refreshToken(payload.sub, payload.jti));
        if (!storedToken) {
            throw new types_1.AppError('Refresh token inválido', 401);
        }
        // Verificar usuario sigue activo
        const usuario = await database_1.prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: { id: true, correo: true, rol: true, activo: true },
        });
        if (!usuario || !usuario.activo) {
            throw new types_1.AppError('Usuario inactivo', 401);
        }
        // Rotar: eliminar refresh token viejo y crear par nuevo
        await redis_1.redis.del(redis_1.redisKeys.refreshToken(payload.sub, payload.jti));
        return this.generarTokens(usuario.id, usuario.correo, usuario.rol);
    }
    async logout(userId, jti, accessTokenExp) {
        const ttl = accessTokenExp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await redis_1.redis.setex(redis_1.redisKeys.blacklistToken(jti), ttl, '1');
        }
        // Eliminar todos los refresh tokens del usuario
        const pattern = redis_1.redisKeys.refreshToken(userId, '*');
        const keys = await redis_1.redis.keys(pattern);
        if (keys.length > 0)
            await redis_1.redis.del(...keys);
    }
    async generarTokens(userId, correo, rol) {
        const jti = (0, uuid_1.v4)();
        const refreshJti = (0, uuid_1.v4)();
        const accessToken = jsonwebtoken_1.default.sign({ sub: userId, correo, rol, jti }, env_1.env.JWT_SECRET, { expiresIn: '8h' } // ✅ Cambiar de '15m' a '8h'
        );
        const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, correo, rol, jti: refreshJti }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Guardar Refresh Token en Redis (7 días en segundos)
        await redis_1.redis.setex(redis_1.redisKeys.refreshToken(userId, refreshJti), 7 * 24 * 60 * 60, refreshToken);
        return {
            accessToken,
            refreshToken,
            expiresIn: 8 * 60 * 60, // 8 horas en segundos
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map