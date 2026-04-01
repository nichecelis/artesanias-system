"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gruposRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const grupos_service_1 = require("../services/grupos.service");
const response_1 = require("../utils/response");
exports.gruposRouter = (0, express_1.Router)();
exports.gruposRouter.use(auth_middleware_1.authenticate);
const grupoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    tipo: zod_1.z.enum(['GRUPO', 'ELITE']),
    direccion: zod_1.z.string().optional(),
    telefono: zod_1.z.string().optional(),
    responsable: zod_1.z.string().optional(),
    porcentajeResponsable: zod_1.z.coerce.number().min(0).max(100).optional(),
});
// Listar
exports.gruposRouter.get('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const params = { ...(0, response_1.parsePagination)(req.query), activo: req.query.activo };
        const result = await grupos_service_1.gruposService.listar(params);
        res.json({ success: true, data: result.data, meta: result.meta });
    }
    catch (e) {
        next(e);
    }
});
// Obtener por ID
exports.gruposRouter.get('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await grupos_service_1.gruposService.obtener(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
// Crear
exports.gruposRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await grupos_service_1.gruposService.crear(grupoSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
// Actualizar
exports.gruposRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await grupos_service_1.gruposService.actualizar(req.params.id, grupoSchema.partial().parse(req.body)), 'Grupo actualizado');
    }
    catch (e) {
        next(e);
    }
});
// Inactivar
exports.gruposRouter.patch('/:id/inactivar', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await grupos_service_1.gruposService.inactivar(req.params.id), 'Grupo inactivado');
    }
    catch (e) {
        next(e);
    }
});
// Activar
exports.gruposRouter.patch('/:id/activar', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await grupos_service_1.gruposService.activar(req.params.id), 'Grupo activado');
    }
    catch (e) {
        next(e);
    }
});
// Eliminar
exports.gruposRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), async (req, res, next) => {
    try {
        await grupos_service_1.gruposService.eliminar(req.params.id);
        (0, response_1.sendSuccess)(res, null, 'Grupo eliminado');
    }
    catch (e) {
        next(e);
    }
});
// Reporte de pagos por grupo
exports.gruposRouter.get('/:id/reporte', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const { fechaDesde, fechaHasta } = req.query;
        const result = await grupos_service_1.gruposService.reportePagos(req.params.id, fechaDesde, fechaHasta);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=grupos.routes.js.map