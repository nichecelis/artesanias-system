import { Request } from 'express';
export interface AuthPayload {
    sub: string;
    correo: string;
    rol: string;
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
//# sourceMappingURL=index.d.ts.map