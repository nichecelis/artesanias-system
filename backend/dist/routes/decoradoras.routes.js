"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaRouter = exports.empleadosRouter = exports.prestamosRouter = exports.decoracionesRouter = exports.decoradorasRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const decoradoras_service_1 = require("../services/decoradoras.service");
const decoraciones_service_1 = require("../services/decoraciones.service");
const prestamos_service_1 = require("../services/prestamos.service");
const empleados_service_1 = require("../services/empleados.service");
const response_1 = require("../utils/response");
const base_controller_1 = require("../controllers/base.controller");
// ─── Decoradoras ──────────────────────────────────────────────
exports.decoradorasRouter = (0, express_1.Router)();
exports.decoradorasRouter.use(auth_middleware_1.authenticate);
const decoradoraSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    documento: zod_1.z.string().min(3).max(20),
    telefono: zod_1.z.string().optional(),
    grupoId: zod_1.z.string().uuid().nullable().optional(),
    banco: zod_1.z.string().optional(),
    numCuenta: zod_1.z.string().optional(),
    tipoCuenta: zod_1.z.nativeEnum(client_1.TipoCuenta).optional(),
});
exports.decoradorasRouter.get('/', async (req, res, next) => {
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
exports.decoradorasRouter.get('/:id', (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => decoradoras_service_1.decoradorasService.obtenerPorId(id)));
exports.decoradorasRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await decoradoras_service_1.decoradorasService.actualizar(req.params.id, decoradoraSchema.partial().parse(req.body));
        (0, response_1.sendSuccess)(res, data, 'Actualizada');
    }
    catch (error) {
        next(error);
    }
});
exports.decoradorasRouter.get('/:id/pagos', async (req, res, next) => {
    try {
        const data = await decoradoras_service_1.decoradorasService.resumenPagos(req.params.id);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
});
// ─── Decoraciones (egreso / ingreso) ─────────────────────────
exports.decoracionesRouter = (0, express_1.Router)();
exports.decoracionesRouter.use(auth_middleware_1.authenticate);
const egresoSchema = zod_1.z.object({
    pedidoId: zod_1.z.string().uuid(),
    decoradoraId: zod_1.z.string().uuid(),
    productoId: zod_1.z.string().uuid(),
    fechaEgreso: zod_1.z.coerce.date(),
    cantidadEgreso: zod_1.z.number().int().positive(),
    precioDecoracion: zod_1.z.number().positive(),
});
const ingresoSchema = zod_1.z.object({
    fechaIngreso: zod_1.z.coerce.date(),
    cantidadIngreso: zod_1.z.number().int().positive(),
    arreglos: zod_1.z.number().int().optional(),
    perdidas: zod_1.z.number().int().optional(),
    compras: zod_1.z.number().optional(),
});
exports.decoracionesRouter.get('/', async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            decoradoraId: req.query.decoradoraId,
            pedidoId: req.query.pedidoId,
            soloSinIngreso: req.query.soloSinIngreso === 'true',
            soloPendientePago: req.query.soloPendientePago === 'true',
        };
        const result = await decoraciones_service_1.decoracionesService.listar(params);
        (0, response_1.sendPaginated)(res, result, params);
    }
    catch (error) {
        next(error);
    }
});
exports.decoracionesRouter.post('/egreso', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await decoraciones_service_1.decoracionesService.registrarEgreso(egresoSchema.parse(req.body));
        res.status(201).json({ success: true, data, message: 'Egreso registrado' });
    }
    catch (error) {
        next(error);
    }
});
exports.decoracionesRouter.patch('/:id/ingreso', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await decoraciones_service_1.decoracionesService.registrarIngreso(req.params.id, ingresoSchema.parse(req.body));
        (0, response_1.sendSuccess)(res, data, 'Ingreso registrado');
    }
    catch (error) {
        next(error);
    }
});
exports.decoracionesRouter.patch('/:id/pagar', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const data = await decoraciones_service_1.decoracionesService.marcarPagado(req.params.id);
        (0, response_1.sendSuccess)(res, data, 'Marcado como pagado');
    }
    catch (error) {
        next(error);
    }
});
// ─── Préstamos ────────────────────────────────────────────────
exports.prestamosRouter = (0, express_1.Router)();
exports.prestamosRouter.use(auth_middleware_1.authenticate);
const prestamoSchema = zod_1.z.object({
    decoradoraId: zod_1.z.string().uuid(),
    monto: zod_1.z.number().positive(),
    fecha: zod_1.z.coerce.date(),
    observacion: zod_1.z.string().optional(),
});
const abonoSchema = zod_1.z.object({
    monto: zod_1.z.number().positive(),
    fecha: zod_1.z.coerce.date(),
});
exports.prestamosRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const data = await prestamos_service_1.prestamosService.crear(prestamoSchema.parse(req.body));
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
});
exports.prestamosRouter.get('/decoradora/:decoradoraId', async (req, res, next) => {
    try {
        const data = await prestamos_service_1.prestamosService.listarPorDecoradora(req.params.decoradoraId);
        (0, response_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
});
exports.prestamosRouter.post('/:id/abonos', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD'), async (req, res, next) => {
    try {
        const data = await prestamos_service_1.prestamosService.abonar(req.params.id, abonoSchema.parse(req.body));
        res.status(201).json({ success: true, data, message: 'Abono registrado' });
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
const nominaSchema = zod_1.z.object({
    empleadoId: zod_1.z.string().uuid(),
    fecha: zod_1.z.string(),
    diasTrabajados: zod_1.z.coerce.number().int().min(0).max(31),
    horasExtras: zod_1.z.coerce.number().min(0).optional(),
    prestamoId: zod_1.z.string().uuid().nullable().optional(),
    abonosPrestamo: zod_1.z.coerce.number().min(0).optional(),
    observaciones: zod_1.z.string().optional(),
});
const actualizarNominaSchema = zod_1.z.object({
    fecha: zod_1.z.string().optional(),
    diasTrabajados: zod_1.z.coerce.number().int().min(0).max(31).optional(),
    horasExtras: zod_1.z.coerce.number().min(0).optional(),
    prestamoId: zod_1.z.string().uuid().nullable().optional(),
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