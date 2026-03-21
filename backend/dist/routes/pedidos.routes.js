"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const pedidos_service_1 = require("../services/pedidos.service");
const response_1 = require("../utils/response");
const types_1 = require("../types");
const pedidosRouter = (0, express_1.Router)();
exports.pedidosRouter = pedidosRouter;
pedidosRouter.use(auth_middleware_1.authenticate);
const fechaOpcional = zod_1.z.string().optional().transform(v => v === '' ? undefined : v);
const numOpcional = zod_1.z.coerce.number().int().optional().transform(v => v === 0 ? undefined : v);
const productoItemSchema = zod_1.z.object({
    productoId: zod_1.z.string().uuid(),
    cantidadPedido: zod_1.z.coerce.number().int().positive(),
    cantidadPlancha: zod_1.z.coerce.number().int().optional(),
    estado: zod_1.z.nativeEnum(client_1.EstadoPedido).optional(),
    fechaInicioCorte: fechaOpcional,
    fechaConteo: fechaOpcional,
    cantidadTareas: numOpcional,
    corte1: numOpcional,
    corte2: numOpcional,
    corte3: numOpcional,
    fechaAsignacion: fechaOpcional,
    fechaDespacho: fechaOpcional,
    cantidadRecibida: numOpcional,
    cantidadDespacho: numOpcional,
    cantidadFaltante: numOpcional,
});
const crearPedidoSchema = zod_1.z.object({
    clienteId: zod_1.z.string().uuid(),
    laser: zod_1.z.enum(['TALLER', 'EXTERNO']).optional(),
    fechaInicioCorte: fechaOpcional,
    observaciones: zod_1.z.string().optional().transform(v => v === '' ? undefined : v),
    productos: zod_1.z.array(productoItemSchema).min(1, 'Al menos un producto'),
});
const actualizarPedidoSchema = zod_1.z.object({
    laser: zod_1.z.enum(['TALLER', 'EXTERNO']).optional(),
    fechaInicioCorte: fechaOpcional,
    observaciones: zod_1.z.string().optional().transform(v => v === '' ? undefined : v),
    productos: zod_1.z.array(productoItemSchema).optional(),
});
pedidosRouter.get('/stats/resumen', async (req, res, next) => {
    try {
        const stats = await pedidos_service_1.pedidosService.estadisticas();
        res.json({ success: true, data: stats });
    }
    catch (e) {
        next(e);
    }
});
// ✅ GET /pedidos/:id - Obtener por ID (dinámica, va AL FINAL)
pedidosRouter.get('/:id', async (req, res, next) => {
    try {
        // Validación manual si no usas Zod en el middleware
        if (req.params.id.length < 30) { // Un UUID tiene 36 caracteres
            throw new types_1.AppError('ID de pedido inválido', 400);
        }
        const pedido = await pedidos_service_1.pedidosService.obtenerPorId(req.params.id);
        res.json({ success: true, data: pedido });
    }
    catch (e) {
        next(e);
    }
});
// ✅ GET /pedidos - Listar con paginación
pedidosRouter.get('/', async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            estado: req.query.estado,
            search: req.query.search,
            fechaDesde: req.query.fechaDesde,
            fechaHasta: req.query.fechaHasta,
        };
        const result = await pedidos_service_1.pedidosService.listar(params);
        (0, response_1.sendSuccess)(res, result.data, 'Pedidos obtenidos correctamente', 200);
    }
    catch (e) {
        next(e);
    }
});
// ✅ POST /pedidos - Crear
pedidosRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await pedidos_service_1.pedidosService.crear(crearPedidoSchema.parse(req.body));
        (0, response_1.sendSuccess)(res, data, 'Pedido creado exitosamente', 201);
    }
    catch (e) {
        next(e);
    }
});
// ✅ PATCH /pedidos/:id/estado - Cambiar estado
pedidosRouter.patch('/:id/estado', async (req, res, next) => {
    try {
        const { estado } = zod_1.z.object({ estado: zod_1.z.nativeEnum(client_1.EstadoPedido) }).parse(req.body);
        const data = await pedidos_service_1.pedidosService.cambiarEstado(req.params.id, estado);
        (0, response_1.sendSuccess)(res, data, 'Estado actualizado correctamente', 200);
    }
    catch (e) {
        next(e);
    }
});
// ✅ PATCH /pedidos/:id - Actualizar
pedidosRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await pedidos_service_1.pedidosService.actualizar(req.params.id, actualizarPedidoSchema.parse(req.body));
        (0, response_1.sendSuccess)(res, data, 'Pedido actualizado correctamente', 200);
    }
    catch (e) {
        next(e);
    }
});
// ✅ PATCH /pedidos/producto/:pedidoProductoId - Actualizar seguimiento
pedidosRouter.patch('/producto/:pedidoProductoId', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const data = await pedidos_service_1.pedidosService.actualizarSeguimientoProducto(req.params.pedidoProductoId, req.body);
        (0, response_1.sendSuccess)(res, data, 'Seguimiento de producto actualizado correctamente', 200);
    }
    catch (e) {
        next(e);
    }
});
exports.default = pedidosRouter;
//# sourceMappingURL=pedidos.routes.js.map