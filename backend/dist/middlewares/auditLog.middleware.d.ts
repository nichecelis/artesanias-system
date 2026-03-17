import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
interface AuditOptions {
    entidad: string;
    accion: 'CREATE' | 'UPDATE' | 'DELETE';
    getEntidadId: (req: AuthRequest) => string;
    getDatosAntes?: (req: AuthRequest) => Promise<unknown>;
}
export declare function auditLog(options: AuditOptions): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=auditLog.middleware.d.ts.map