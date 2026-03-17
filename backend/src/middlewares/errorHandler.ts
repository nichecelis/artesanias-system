import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Manejo de Errores de Validación (Zod)
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.');
      errors[key] = errors[key] ?? [];
      errors[key].push(e.message);
    });

    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors,
    } satisfies ApiResponse);
  }

  // 2. Manejo de Errores de Prisma (Base de Datos)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') ?? 'campo';
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con ese ${field}`,
      } satisfies ApiResponse);
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      } satisfies ApiResponse);
    }
  }

  // 3. Manejo de códigos de estado y logs
  let statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Error interno del servidor';

  if (statusCode < 100 || statusCode > 599) statusCode = 500;

  if (statusCode === 500) {
    logger.error('Error no controlado:', {
      message: message,
      stack: err.stack,
      url: req.url,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Error interno del servidor' 
      : message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  } satisfies ApiResponse);
};
