import { Request } from 'express';
declare const ROLES: {
    readonly ADMINISTRADOR: "ADMINISTRADOR";
    readonly PRODUCCION: "PRODUCCION";
    readonly CONTABILIDAD: "CONTABILIDAD";
};
export type Rol = (typeof ROLES)[keyof typeof ROLES];
declare const ESTADOS_PEDIDO: {
    readonly PENDIENTE: "PENDIENTE";
    readonly EN_PROCESO: "EN_PROCESO";
    readonly TERMINADO: "TERMINADO";
    readonly DESPACHADO: "DESPACHADO";
    readonly CANCELADO: "CANCELADO";
};
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[keyof typeof ESTADOS_PEDIDO];
declare const ESTADOS_PRODUCTO: {
    readonly PENDIENTE: "PENDIENTE";
    readonly CORTE: "CORTE";
    readonly ENSAMBLE: "ENSAMBLE";
    readonly DECORACION: "DECORACION";
    readonly TERMINADO: "TERMINADO";
    readonly CANCELADO: "CANCELADO";
};
export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[keyof typeof ESTADOS_PRODUCTO];
declare const TIPOS_GRUPO: {
    readonly GRUPO: "GRUPO";
    readonly ELITE: "ELITE";
};
export type TipoGrupo = (typeof TIPOS_GRUPO)[keyof typeof TIPOS_GRUPO];
export interface AuthPayload {
    sub: string;
    correo: string;
    rol: Rol;
    jti: string;
    iat?: number;
    exp?: number;
}
export interface AuthRequest extends Request {
    user: AuthPayload;
}
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
export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
}
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export {};
//# sourceMappingURL=index.d.ts.map