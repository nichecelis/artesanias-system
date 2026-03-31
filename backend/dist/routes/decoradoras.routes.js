"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaRouter = exports.empleadosRouter = exports.decoradorasRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const decoradoras_service_1 = require("../services/decoradoras.service");
const empleados_service_1 = require("../services/empleados.service");
const response_1 = require("../utils/response");
const base_controller_1 = require("../controllers/base.controller");
// ─── Decoradoras ──────────────────────────────────────────────
exports.decoradorasRouter = (0, express_1.Router)();
exports.decoradorasRouter.use(auth_middleware_1.authenticate);
const grupoIdSchema = zod_1.z.union([
    zod_1.z.string().uuid(),
    zod_1.z.string().min(1),
    zod_1.z.literal(''),
]).transform(v => v === '' ? null : v).optional();
const decoradoraSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    documento: zod_1.z.string().min(3).max(20),
    telefono: zod_1.z.string().optional(),
    grupoId: grupoIdSchema,
    banco: zod_1.z.string().optional(),
    numCuenta: zod_1.z.string().optional(),
    tipoCuenta: zod_1.z.nativeEnum(client_1.TipoCuenta).optional(),
});
const decoradoraUpdateSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200).optional(),
    documento: zod_1.z.string().min(3).max(20).optional(),
    telefono: zod_1.z.string().optional(),
    grupoId: zod_1.z.union([
        zod_1.z.string().uuid(),
        zod_1.z.string().min(1),
        zod_1.z.literal(''),
        zod_1.z.null(),
    ]).transform(v => v === '' ? null : v).optional().nullable(),
    banco: zod_1.z.string().optional().nullable(),
    numCuenta: zod_1.z.string().optional().nullable(),
    tipoCuenta: zod_1.z.nativeEnum(client_1.TipoCuenta).optional().nullable(),
});
exports.decoradorasRouter.get('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
        };
        const result = await decoradoras_service_1.decoradorasService.listar(params);
        (0, response_1.sendPaginated)(res, result, params);
    }
    catch (error) {
        next(error);
    }
});
exports.decoradorasRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await decoradoras_service_1.decoradorasService.crear(decoradoraSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
exports.decoradorasRouter.get('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => decoradoras_service_1.decoradorasService.obtenerPorId(id)));
exports.decoradorasRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const parsed = decoradoraUpdateSchema.parse(req.body);
        const updateData = {};
        if (parsed.nombre !== undefined)
            updateData.nombre = parsed.nombre;
        if (parsed.documento !== undefined)
            updateData.documento = parsed.documento;
        if (parsed.telefono !== undefined && parsed.telefono !== null)
            updateData.telefono = parsed.telefono;
        if (parsed.grupoId !== undefined)
            updateData.grupoId = parsed.grupoId;
        if (parsed.banco !== undefined && parsed.banco !== null)
            updateData.banco = parsed.banco;
        if (parsed.numCuenta !== undefined && parsed.numCuenta !== null)
            updateData.numCuenta = parsed.numCuenta;
        if (parsed.tipoCuenta !== undefined)
            updateData.tipoCuenta = parsed.tipoCuenta;
        const data = await decoradoras_service_1.decoradorasService.actualizar(req.params.id, updateData);
        (0, response_1.sendSuccess)(res, data, 'Actualizada');
    }
    catch (error) {
        next(error);
    }
});
exports.decoradorasRouter.get('/:id/pagos', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await decoradoras_service_1.decoradorasService.resumenPagos(req.params.id);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
});
// ─── Empleados ────────────────────────────────────────────────
exports.empleadosRouter = (0, express_1.Router)();
exports.empleadosRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'));
const empleadoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    documento: zod_1.z.string().min(3).max(20),
    salario: zod_1.z.number().positive(),
});
exports.empleadosRouter.get('/', async (req, res, next) => {
    try {
        const params = (0, response_1.parsePagination)(req.query);
        const result = await empleados_service_1.empleadosService.listar(params);
        (0, response_1.sendPaginated)(res, result, params);
    }
    catch (error) {
        next(error);
    }
});
exports.empleadosRouter.post('/', async (req, res, next) => {
    try {
        const data = await empleados_service_1.empleadosService.crear(empleadoSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
exports.empleadosRouter.get('/:id', (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => empleados_service_1.empleadosService.obtenerPorId(id)));
exports.empleadosRouter.patch('/:id', async (req, res, next) => {
    try {
        const data = await empleados_service_1.empleadosService.actualizar(req.params.id, empleadoSchema.partial().parse(req.body));
        (0, response_1.sendSuccess)(res, data, 'Actualizado');
    }
    catch (error) {
        next(error);
    }
});
// ─── Nómina ───────────────────────────────────────────────────
exports.nominaRouter = (0, express_1.Router)();
exports.nominaRouter.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'));
const uuidOpcional = zod_1.z.union([zod_1.z.string().uuid(), zod_1.z.literal(''), zod_1.z.null()]).transform(v => v === '' ? null : v).optional();
const nominaSchema = zod_1.z.object({
    empleadoId: zod_1.z.string().uuid(),
    fecha: zod_1.z.string(),
    diasTrabajados: zod_1.z.coerce.number().int().min(0).max(31),
    horasExtras: zod_1.z.coerce.number().min(0).optional(),
    prestamoId: uuidOpcional,
    abonosPrestamo: zod_1.z.coerce.number().min(0).optional(),
    observaciones: zod_1.z.string().optional(),
});
const actualizarNominaSchema = zod_1.z.object({
    fecha: zod_1.z.string().optional(),
    diasTrabajados: zod_1.z.coerce.number().int().min(0).max(31).optional(),
    horasExtras: zod_1.z.coerce.number().min(0).optional(),
    prestamoId: uuidOpcional,
    abonosPrestamo: zod_1.z.coerce.number().min(0).optional(),
    observaciones: zod_1.z.string().optional(),
});
exports.nominaRouter.get('/', async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            empleadoId: req.query.empleadoId,
            mes: req.query.mes,
        };
        const result = await empleados_service_1.nominaService.listar(params);
        (0, response_1.sendPaginated)(res, result, params);
    }
    catch (error) {
        next(error);
    }
});
exports.nominaRouter.post('/', async (req, res, next) => {
    try {
        const data = await empleados_service_1.nominaService.registrar(nominaSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
exports.nominaRouter.get('/total-mes', async (req, res, next) => {
    try {
        const { mes } = zod_1.z.object({ mes: zod_1.z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query);
        const data = await empleados_service_1.nominaService.totalMes(mes);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=decoradoras.routes.js.map