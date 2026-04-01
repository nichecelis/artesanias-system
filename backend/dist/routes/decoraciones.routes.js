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
const uuidOpcional = zod_1.z.union([zod_1.z.string().uuid(), zod_1.z.literal(''), zod_1.z.null()]).transform(v => v === '' ? null : v).optional();
const productoDecoracionSchema = zod_1.z.object({
    productoId: zod_1.z.string().uuid(),
    fechaEgreso: zod_1.z.string(),
    cantidadEgreso: zod_1.z.coerce.number().int().positive(),
});
const crearSchema = zod_1.z.object({
    pedidoId: zod_1.z.string().uuid(),
    decoradoraId: zod_1.z.string().uuid(),
    productos: zod_1.z.array(productoDecoracionSchema).min(1, 'Al menos un producto'),
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
    prestamoId: uuidOpcional,
    pagado: zod_1.z.boolean().optional(),
});
const actualizarManySchema = zod_1.z.object({
    decoraciones: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        fechaIngreso: zod_1.z.string().optional(),
        cantidadIngreso: zod_1.z.coerce.number().int().optional(),
        arreglos: zod_1.z.coerce.number().int().optional(),
        perdidas: zod_1.z.coerce.number().int().optional(),
        compras: zod_1.z.coerce.number().optional(),
        abonosPrestamo: zod_1.z.coerce.number().optional(),
        prestamoId: uuidOpcional,
        pagado: zod_1.z.boolean().optional(),
    })).min(1, 'Al menos una decoración'),
});
exports.decoracionesRouter.get('/reporte-por-grupo', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const params = {
            grupoId: req.query.grupoId,
            decoradoraId: req.query.decoradoraId,
            fechaDesde: req.query.fechaDesde,
            fechaHasta: req.query.fechaHasta,
            search: req.query.search,
            incluirPagadas: req.query.incluirPagadas === 'true',
        };
        const result = await decoraciones_service_1.decoracionesService.reportePorGrupo(params);
        (0, response_1.sendSuccess)(res, result);
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.get('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            decoradoraId: req.query.decoradoraId,
            pedidoId: req.query.pedidoId,
            pagado: req.query.pagado !== undefined ? req.query.pagado === 'true' : undefined,
            fechaDesde: req.query.fechaDesde,
            fechaHasta: req.query.fechaHasta,
        };
        if (req.query.agrupado === 'true') {
            const result = await decoraciones_service_1.decoracionesService.listarAgrupado(params);
            res.json({ success: true, data: result.items, meta: { total: result.total, page: 1, limit: 1000, totalPages: 1 } });
        }
        else {
            const result = await decoraciones_service_1.decoracionesService.listar(params);
            res.json({ success: true, data: result.items, meta: {
                    total: result.total, page: params.page, limit: params.limit,
                    totalPages: Math.ceil(result.total / params.limit),
                } });
        }
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.get('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
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
exports.decoracionesRouter.patch('/batch', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const { decoraciones } = actualizarManySchema.parse(req.body);
        const results = await decoraciones_service_1.decoracionesService.actualizarVarias(decoraciones);
        (0, response_1.sendSuccess)(res, results, `${results.length} decoración(es) actualizada(s)`);
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await decoraciones_service_1.decoracionesService.actualizar(req.params.id, actualizarSchema.parse(req.body)), 'Decoración actualizada');
    }
    catch (e) {
        next(e);
    }
});
exports.decoracionesRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), async (req, res, next) => {
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
const pagarMasivoSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'Selecciona al menos una decoración'),
});
exports.decoracionesRouter.post('/pagar-masivo', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const { ids } = pagarMasivoSchema.parse(req.body);
        const result = await decoraciones_service_1.decoracionesService.pagarDecoraciones(ids);
        (0, response_1.sendSuccess)(res, result, `${result.decoracionesPagadas.length} decoración(es) marcada(s) como pagada(s)`);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=decoraciones.routes.js.map