"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuariosRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const usuarios_service_1 = require("../services/usuarios.service");
const response_1 = require("../utils/response");
const usuariosRouter = (0, express_1.Router)();
exports.usuariosRouter = usuariosRouter;
usuariosRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMINISTRADOR'));
const crearSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    correo: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    rol: zod_1.z.nativeEnum(client_1.Rol),
});
const actualizarSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200).optional(),
    correo: zod_1.z.string().email().optional(),
    rol: zod_1.z.nativeEnum(client_1.Rol).optional(),
    activo: zod_1.z.boolean().optional(),
});
const actualizarPorCorreoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200).optional(),
    rol: zod_1.z.nativeEnum(client_1.Rol).optional(),
    password: zod_1.z.string().min(6).optional(),
});
usuariosRouter.get('/', async (req, res, next) => {
    try {
        const params = (0, response_1.parsePagination)(req.query);
        const result = await usuarios_service_1.usuariosService.listar(params);
        res.json({ success: true, data: result.items, meta: {
                total: result.total, page: params.page, limit: params.limit,
                totalPages: Math.ceil(result.total / params.limit),
            } });
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.get('/correo/:correo', async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await usuarios_service_1.usuariosService.obtenerPorCorreo(req.params.correo));
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.get('/:id', async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await usuarios_service_1.usuariosService.obtenerPorId(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.post('/', async (req, res, next) => {
    try {
        const data = await usuarios_service_1.usuariosService.crear(crearSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.patch('/correo/:correo', async (req, res, next) => {
    try {
        const data = await usuarios_service_1.usuariosService.actualizarPorCorreo(req.params.correo, actualizarPorCorreoSchema.parse(req.body));
        (0, response_1.sendSuccess)(res, data, 'Usuario actualizado');
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.patch('/:id', async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await usuarios_service_1.usuariosService.actualizar(req.params.id, actualizarSchema.parse(req.body)), 'Usuario actualizado');
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.patch('/:id/password', async (req, res, next) => {
    try {
        const { password } = zod_1.z.object({ password: zod_1.z.string().min(6) }).parse(req.body);
        (0, response_1.sendSuccess)(res, await usuarios_service_1.usuariosService.cambiarPassword(req.params.id, password), 'Contraseña actualizada');
    }
    catch (e) {
        next(e);
    }
});
usuariosRouter.delete('/:id', async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await usuarios_service_1.usuariosService.eliminar(req.params.id), 'Usuario desactivado');
    }
    catch (e) {
        next(e);
    }
});
exports.default = usuariosRouter;
//# sourceMappingURL=usuarios.routes.js.map