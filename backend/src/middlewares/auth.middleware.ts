import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError, AuthPayload, AuthRequest } from '../types';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Verificando autenticación...');
    console.log('📋 Header:', authHeader ? '✅ Presente' : '❌ No presente');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Token de autenticación requerido', 401));
    }

    const token = authHeader.substring(7);
    console.log('🔑 JWT_SECRET usando:', env.JWT_SECRET.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    
    console.log('✅ Token válido para usuario:', decoded.correo);
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    console.error('❌ Error de autenticación:', error);
    next(new AppError('Su sesión ha expirado o el token es inválido', 401));
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return next(new AppError('No autenticado', 401));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
      return next(
        new AppError(`Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`, 403)
      );
    }

    next();
  };
}
