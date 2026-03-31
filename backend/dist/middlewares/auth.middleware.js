"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const types_1 = require("../types");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next(new types_1.AppError('Token de autenticación requerido', 401));
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new types_1.AppError('Su sesión ha expirado o el token es inválido', 401));
    }
}
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user) {
            return next(new types_1.AppError('No autenticado', 401));
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
            return next(new types_1.AppError(`Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`, 403));
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map