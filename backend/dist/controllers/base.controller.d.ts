import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    limit?: number | undefined;
    search?: string | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare function handleListar(req: Request, res: Response, next: NextFunction, serviceFn: (params: any) => Promise<{
    items: any[];
    total: number;
}>, extraParams?: Record<string, unknown>): Promise<void>;
export declare function handleObtener(req: Request, res: Response, next: NextFunction, serviceFn: (id: string) => Promise<any>): Promise<void>;
export declare function handleCrear(req: Request, res: Response, next: NextFunction, serviceFn: (dto: any) => Promise<any>, schema?: ZodSchema): Promise<void>;
export declare function handleActualizar(req: Request, res: Response, next: NextFunction, serviceFn: (id: string, dto: any) => Promise<any>, schema?: ZodSchema): Promise<void>;
export declare function handleEliminar(req: Request, res: Response, next: NextFunction, serviceFn: (id: string, ...args: any[]) => Promise<any>, extraArgs?: any[]): Promise<void>;
//# sourceMappingURL=base.controller.d.ts.map