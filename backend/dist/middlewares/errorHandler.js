"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
    // 1. Manejo de Errores de Validación (Zod)
    if (err instanceof zod_1.ZodError) {
        const errors = {};
        err.errors.forEach((e) => {
            const key = e.path.join('.');
            errors[key] = errors[key] ?? [];
            errors[key].push(e.message);
        });
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors,
        });
    }
    // 2. Manejo de Errores de Prisma (Base de Datos)
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const field = err.meta?.target?.join(', ') ?? 'campo';
            return res.status(409).json({
                success: false,
                message: `Ya existe un registro con ese ${field}`,
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado',
            });
        }
    }
    // 3. Manejo de códigos de estado y logs
    let statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    const message = err.message || 'Error interno del servidor';
    if (statusCode < 100 || statusCode > 599)
        statusCode = 500;
    if (statusCode === 500) {
        logger_1.logger.error('Error no controlado:', {
            message: message,
            stack: err.stack,
            url: req.url,
        });
    }
    return res.status(statusCode).json({
        success: false,
        message: message, // <--- Aquí llegará el texto del error al Frontend
        ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map