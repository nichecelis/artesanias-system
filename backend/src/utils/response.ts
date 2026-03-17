import { Response } from 'express';
import { ApiResponse, PaginatedResult, PaginationMeta, PaginationParams } from '../types';

// ─── Respuestas HTTP estandarizadas ──────────────────────────

export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message: string = 'Operación exitosa', // <--- Añade un valor por defecto
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Creado exitosamente'): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  result: PaginatedResult<T>,
  params: PaginationParams,
): Response {
  const totalPages = Math.ceil(result.total / params.limit);
  const meta: PaginationMeta = {
    total: result.total,
    page: params.page,
    limit: params.limit,
    totalPages,
  };

  return res.status(200).json({
    success: true,
    data: result.items,
    meta,
  } satisfies ApiResponse<T[]>);
}

// ─── Parsear parámetros de paginación del request ────────────

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page  = Math.max(1, parseInt(String(query.page  ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10)));

  return {
    page,
    limit,
    search:    query.search    ? String(query.search)    : undefined,
    sortBy:    query.sortBy    ? String(query.sortBy)    : undefined,
    sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
  };
}

// ─── Calcular offset para Prisma ─────────────────────────────

export function getPrismaSkip(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

// ─── Generar código de pedido autoincrementado ───────────────

export function generarCodigoPedido(numero: number): string {
  const year = new Date().getFullYear();
  const padded = String(numero).padStart(5, '0');
  return `ART-${year}-${padded}`;
}
