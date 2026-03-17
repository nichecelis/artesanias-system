import { Response } from 'express';
import { PaginatedResult, PaginationParams } from '../types';
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
export declare function sendCreated<T>(res: Response, data: T, message?: string): Response;
export declare function sendPaginated<T>(res: Response, result: PaginatedResult<T>, params: PaginationParams): Response;
export declare function parsePagination(query: Record<string, unknown>): PaginationParams;
export declare function getPrismaSkip(params: PaginationParams): number;
export declare function generarCodigoPedido(numero: number): string;
//# sourceMappingURL=utilsesponse.d.ts.map