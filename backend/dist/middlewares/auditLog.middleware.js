"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
function auditLog(options) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        let datosAntes;
        // Capturar datos antes si se requiere
        if (options.getDatosAntes) {
            try {
                datosAntes = await options.getDatosAntes(req);
            }
            catch {
                // No bloquear la request si falla el pre-fetch
            }
        }
        // Interceptar respuesta para capturar los datos después
        res.json = function (body) {
            if (res.statusCode < 400 && req.user) {
                const entidadId = options.getEntidadId(req);
                database_1.prisma.auditLog.create({
                    data: {
                        usuarioId: req.user.sub,
                        accion: options.accion,
                        entidad: options.entidad,
                        entidadId,
                        datosAntes: datosAntes ? datosAntes : undefined,
                        datosDespues: body?.data ?? undefined,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                    },
                }).catch((err) => logger_1.logger.error('Error guardando audit log:', err));
            }
            return originalJson(body);
        };
        next();
    };
}
//# sourceMappingURL=auditLog.middleware.js.map