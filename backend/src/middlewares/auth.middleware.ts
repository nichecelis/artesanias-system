import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';
import { env } from '../config/env';
import { redis, redisKeys } from '../config/redis';
import { AppError, AuthPayload, AuthRequest } from '../types';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      // CORRECCIÓN: Primero el mensaje, luego el código
      throw new AppError('Token de autenticación requerido', 401);
    }

    const token = authHeader.slice(7);
    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {
      throw new AppError('Token inválido o expirado', 401);
    }

    const isBlacklisted = await redis.get(redisKeys.blacklistToken(payload.jti));
    if (isBlacklisted) {
      throw new AppError('Token inválido', 401);
    }

    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return next(new AppError('No autenticado', 401));
    }

    if (roles.length > 0 && !roles.includes(user.rol)) {
      return next(
        // CORRECCIÓN: El string va primero
        new AppError(`Acceso denegado. Roles permitidos: ${roles.join(', ')}`, 403)
      );
    }

    next();
  };
}
