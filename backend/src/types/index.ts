import { Request } from 'express';

// ─── Roles del sistema (Const Types Pattern) ─────────────────
const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  PRODUCCION: 'PRODUCCION',
  CONTABILIDAD: 'CONTABILIDAD',
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

// ─── Estados de pedido (Const Types Pattern) ─────────────────
const ESTADOS_PEDIDO = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  TERMINADO: 'TERMINADO',
  DESPACHADO: 'DESPACHADO',
  CANCELADO: 'CANCELADO',
} as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[keyof typeof ESTADOS_PEDIDO];

// ─── Estados de producto (Const Types Pattern) ────────────────
const ESTADOS_PRODUCTO = {
  PENDIENTE: 'PENDIENTE',
  CORTE: 'CORTE',
  ENSAMBLE: 'ENSAMBLE',
  DECORACION: 'DECORACION',
  TERMINADO: 'TERMINADO',
  CANCELADO: 'CANCELADO',
} as const;

export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[keyof typeof ESTADOS_PRODUCTO];

// ─── Tipos de grupo (Const Types Pattern) ────────────────────
const TIPOS_GRUPO = {
  GRUPO: 'GRUPO',
  ELITE: 'ELITE',
} as const;

export type TipoGrupo = (typeof TIPOS_GRUPO)[keyof typeof TIPOS_GRUPO];

// ─── Usuario autenticado en el request ───────────────────────
export interface AuthPayload {
  sub: string;
  correo: string;
  rol: Rol;
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
  activo?: boolean | string;
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
