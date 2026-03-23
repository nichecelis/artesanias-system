// ─── Roles del sistema (Const Types Pattern) ─────────────────
const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  PRODUCCION: 'PRODUCCION',
  CONTABILIDAD: 'CONTABILIDAD',
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_LIST = Object.values(ROLES);

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

// ─── Colores por rol ────────────────────────────────────────
export const ROL_COLORS: Record<Rol, string> = {
  ADMINISTRADOR: 'bg-red-100 text-red-800',
  PRODUCCION: 'bg-blue-100 text-blue-800',
  CONTABILIDAD: 'bg-yellow-100 text-yellow-800',
};

// ─── Tipos de API ───────────────────────────────────────────
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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}
