import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface AuditOptions {
  entidad: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  getEntidadId: (req: AuthRequest) => string;
  getDatosAntes?: (req: AuthRequest) => Promise<unknown>;
}

export function auditLog(options: AuditOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    let datosAntes: unknown;

    // Capturar datos antes si se requiere
    if (options.getDatosAntes) {
      try {
        datosAntes = await options.getDatosAntes(req);
      } catch {
        // No bloquear la request si falla el pre-fetch
      }
    }

    // Interceptar respuesta para capturar los datos después
    res.json = function (body) {
      if (res.statusCode < 400 && req.user) {
        const entidadId = options.getEntidadId(req);

        prisma.auditLog.create({
          data: {
            usuarioId:    req.user.sub,
            accion:       options.accion,
            entidad:      options.entidad,
            entidadId,
            datosAntes:   datosAntes ? (datosAntes as any) : undefined,
            datosDespues: body?.data ?? undefined,
            ip:           req.ip,
            userAgent:    req.get('User-Agent'),
          },
        }).catch((err) => logger.error('Error guardando audit log:', err));
      }
      return originalJson(body);
    };

    next();
  };
}
