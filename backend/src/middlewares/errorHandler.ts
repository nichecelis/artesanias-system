import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { AppError, ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ─── AppError (errores de negocio controlados) ────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    } satisfies ApiResponse);
    return;
  }

  // ─── Errores de validación de Zod ────────────────────────
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.');
      errors[key] = errors[key] ?? [];
      errors[key].push(e.message);
    });

    res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors,
    } satisfies ApiResponse);
    return;
  }

  // ─── Errores de Prisma ────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint
      const field = (err.meta?.target as string[])?.join(', ') ?? 'campo';
      res.status(409).json({
        success: false,
        message: `Ya existe un registro con ese ${field}`,
      } satisfies ApiResponse);
      return;
    }

    if (err.code === 'P2025') {
      // Record not found
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      } satisfies ApiResponse);
      return;
    }

    logger.error('Prisma known error:', { code: err.code, meta: err.meta });
    res.status(500).json({
      success: false,
      message: 'Error de base de datos',
    } satisfies ApiResponse);
    return;
  }

  // ─── Error genérico ───────────────────────────────────────
  const error = err as Error;
  logger.error('Error no controlado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : error.message,
    ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
  } satisfies ApiResponse);
}
