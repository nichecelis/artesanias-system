import { Response } from 'express';
import { PaginatedResult, PaginationParams } from '../types';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, // <--- Añade un valor por defecto
statusCode?: number) => Response;
export declare function sendError(res: Response, statusCode: number, message: string, errors?: any): Response;
export declare function sendCreated<T>(res: Response, data: T, message?: string): Response;
export declare function sendPaginated<T>(res: Response, result: PaginatedResult<T>, params: PaginationParams): Response;
export declare function parsePagination(query: Record<string, unknown>): PaginationParams;
export declare function getPrismaSkip(params: PaginationParams): number;
export declare function generarCodigoPedido(numero: number): string;
//# sourceMappingURL=response.d.ts.map