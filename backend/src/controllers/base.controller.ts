import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendSuccess, sendCreated, sendPaginated, parsePagination } from '../utils/response';
import { AuthRequest } from '../types';

// ─── Schemas de validación reutilizables ─────────────────────

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const paginationQuerySchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  search:    z.string().optional(),
  sortBy:    z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ─── Decoradores de validación ────────────────────────────────

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// ─── Helpers de controller ────────────────────────────────────

export async function handleListar(
  req: Request,
  res: Response,
  next: NextFunction,
  serviceFn: (params: any) => Promise<{ items: any[]; total: number }>,
  extraParams: Record<string, unknown> = {},
): Promise<void> {
  try {
    const params = { ...parsePagination(req.query as any), ...extraParams };
    const result = await serviceFn(params);
    sendPaginated(res, result, params);
  } catch (error) {
    next(error);
  }
}

export async function handleObtener(
  req: Request,
  res: Response,
  next: NextFunction,
  serviceFn: (id: string) => Promise<any>,
): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = await serviceFn(id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function handleCrear(
  req: Request,
  res: Response,
  next: NextFunction,
  serviceFn: (dto: any) => Promise<any>,
  schema?: ZodSchema,
): Promise<void> {
  try {
    const dto = schema ? schema.parse(req.body) : req.body;
    const data = await serviceFn(dto);
    sendCreated(res, data);
  } catch (error) {
    next(error);
  }
}

export async function handleActualizar(
  req: Request,
  res: Response,
  next: NextFunction,
  serviceFn: (id: string, dto: any) => Promise<any>,
  schema?: ZodSchema,
): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const dto = schema ? schema.parse(req.body) : req.body;
    const data = await serviceFn(id, dto);
    sendSuccess(res, data, 'Actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function handleEliminar(
  req: Request,
  res: Response,
  next: NextFunction,
  serviceFn: (id: string, ...args: any[]) => Promise<any>,
  extraArgs: any[] = [],
): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    await serviceFn(id, ...extraArgs);
    sendSuccess(res, null, 'Eliminado exitosamente');
  } catch (error) {
    next(error);
  }
}
