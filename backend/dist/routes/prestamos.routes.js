"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prestamosRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prestamos_service_1 = require("../services/prestamos.service");
const response_1 = require("../utils/response");
exports.prestamosRouter = (0, express_1.Router)();
exports.prestamosRouter.use(auth_middleware_1.authenticate);
const crearSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['DECORADORA', 'EMPLEADO']),
    beneficiarioId: zod_1.z.string().uuid(),
    monto: zod_1.z.coerce.number().positive(),
    fecha: zod_1.z.string(),
    cuotas: zod_1.z.coerce.number().int().positive().optional(),
    observacion: zod_1.z.string().optional(),
});
const abonoSchema = zod_1.z.object({
    monto: zod_1.z.coerce.number().positive(),
    fecha: zod_1.z.string(),
});
exports.prestamosRouter.get('/', async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            tipo: req.query.tipo,
            decoradoraId: req.query.decoradoraId,
            empleadoId: req.query.empleadoId,
            soloConSaldo: req.query.soloConSaldo === 'true',
        };
        const result = await prestamos_service_1.prestamosService.listar(params);
        res.json({ success: true, data: result.items, meta: {
                total: result.total, page: params.page, limit: params.limit,
                totalPages: Math.ceil(result.total / params.limit),
            } });
    }
    catch (e) {
        next(e);
    }
});
exports.prestamosRouter.get('/:id', async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await prestamos_service_1.prestamosService.obtenerPorId(req.params.id));
    }
    catch (e) {
        next(e);
    }
});
exports.prestamosRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const data = await prestamos_service_1.prestamosService.crear(crearSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
exports.prestamosRouter.post('/:id/abonos', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const { monto, fecha } = abonoSchema.parse(req.body);
        (0, response_1.sendSuccess)(res, await prestamos_service_1.prestamosService.abonar(req.params.id, monto, fecha), 'Abono registrado');
    }
    catch (e) {
        next(e);
    }
});
exports.prestamosRouter.delete('/abonos/:abonoId', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await prestamos_service_1.prestamosService.eliminarAbono(req.params.abonoId), 'Abono eliminado');
    }
    catch (e) {
        next(e);
    }
});
exports.prestamosRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await prestamos_service_1.prestamosService.eliminar(req.params.id), 'Préstamo eliminado');
    }
    catch (e) {
        next(e);
    }
});
exports.prestamosRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const { archivoFirmado } = req.body;
        (0, response_1.sendSuccess)(res, await prestamos_service_1.prestamosService.actualizarArchivo(req.params.id, archivoFirmado), 'Archivo actualizado');
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=prestamos.routes.js.map