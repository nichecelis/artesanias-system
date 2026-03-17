import { Request } from 'express';

// ─── Usuario autenticado en el request ───────────────────────
export interface AuthPayload {
  sub: string;
  correo: string;
  rol: string;        // ← String, no Rol enum
  jti: string;
  iat?: number;
  exp?: number;
}

// Express Request extendido con el usuario autenticado
export interface AuthRequest extends Request {
  user: AuthPayload;
}

// ─── Respuestas API estandarizadas ───────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Parámetros de paginación ────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Resultado paginado del repositorio ──────────────────────
export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

// ─── Error de la app ─────────────────────────────────────────
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
