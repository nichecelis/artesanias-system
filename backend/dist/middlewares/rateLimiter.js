"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.rateLimiter = void 0;
exports.notFoundHandler = notFoundHandler;
exports.requestLogger = requestLogger;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// ─── Rate Limiter ─────────────────────────────────────────────
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    },
    skip: (req) => req.path === '/health' || process.env.NODE_ENV === 'test' || req.headers['x-test-mode'] === 'true',
});
// Rate limiter más estricto para endpoints de autenticación
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
    },
    skip: (req) => process.env.NODE_ENV === 'test',
});
// ─── Not Found Handler ────────────────────────────────────────
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.method} ${req.path} no encontrada`,
    });
}
// ─── Request Logger ───────────────────────────────────────────
function requestLogger(req, _res, next) {
    logger_1.logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
}
//# sourceMappingURL=rateLimiter.js.map