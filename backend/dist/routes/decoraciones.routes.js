"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoracionesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const decoraciones_service_1 = require("../services/decoraciones.service");
const response_1 = require("../utils/response");
exports.decoracionesRouter = (0, express_1.Router)();
exports.decoracionesRouter.use(auth_middleware_1.authenticate);
const crearSchema = zod_1.z.object({
    pedidoId: zod_1.z.string().uuid(),
    decoradoraId: zod_1.z.string().uuid(),
    productoId: zod_1.z.string().uuid(),
    fechaEgreso: zod_1.z.string(),
    cantidadEgreso: zod_1.z.coerce.number().int().positive(),
});
const actualizarSchema = zod_1.z.object({
    fechaEgreso: zod_1.z.string().optional(),
    cantidadEgreso: zod_1.z.coerce.number().int().positive().optional(),
    fechaIngreso: zod_1.z.string().optional(),
    cantidadIngreso: zod_1.z.coerce.number().int().optional(),
    arreglos: zod_1.z.coerce.number().int().optional(),
    perdidas: zod_1.z.coerce.number().int().optional(),
    compras: zod_1.z.coerce.number().optional(),
    abonosPrestamo: zod_1.z.coerce.number().optional(),
    prestamoId: zod_1.z.string().uuid().nullable().optional(),
    pagado: zod_1.z.boolean().optional(),
});
exports.decoracionesRouter.get('/', async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            decoradoraId: req.query.decoradoraId,
            pedidoId: req.query.pedidoId,
            pagado: req.query.pagado !== undefined ? req.query.pagado === 'true' : undefined,
            fechaDesde: req.query.fechaDesde,
            fechaHasta: req.query.fechaHasta,
        };
        const result = await decoraciones_service_1.decoracionesService.listar(params);
        res.json({ success: true, data: result.items, meta: {
                total: result.total, page: params.page, limit: params.limit,
                totalPages: Math.ceil(result.total / params.limit),
            } });
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.get('/:id', async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await decoraciones_service_1.decoracionesService.obtenerPorId(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await decoraciones_service_1.decoracionesService.crear(crearSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await decoraciones_service_1.decoracionesService.actualizar(req.params.id, actualizarSchema.parse(req.body)), 'Decoración actualizada');
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await decoraciones_service_1.decoracionesService.eliminar(req.params.id), 'Decoración eliminada');
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.patch('/:id/pagar', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await decoraciones_service_1.decoracionesService.marcarPagado(req.params.id), 'Marcada como pagada');
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=decoraciones.routes.js.map