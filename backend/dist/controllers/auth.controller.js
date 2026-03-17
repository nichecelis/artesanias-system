"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const loginSchema = zod_1.z.object({
    correo: zod_1.z.string().email('Correo inválido'),
    password: zod_1.z.string().min(1, 'Contraseña requerida'),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token requerido'),
});
class AuthController {
    async login(req, res, next) {
        try {
            const dto = loginSchema.parse(req.body);
            const result = await auth_service_1.authService.login(dto);
            (0, response_1.sendSuccess)(res, result, 'Autenticación exitosa');
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = refreshSchema.parse(req.body);
            const tokens = await auth_service_1.authService.refresh(refreshToken);
            (0, response_1.sendSuccess)(res, tokens, 'Token renovado');
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const user = req.user;
            await auth_service_1.authService.logout(user.sub, user.jti, user.exp ?? 0);
            (0, response_1.sendSuccess)(res, null, 'Sesión cerrada exitosamente');
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            const user = req.user;
            (0, response_1.sendSuccess)(res, { id: user.sub, correo: user.correo, rol: user.rol });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map