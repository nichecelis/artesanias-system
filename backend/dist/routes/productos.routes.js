"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosRouter = exports.clientesRouter = void 0;
// ─────────────────────────────────────────────────────────────
// productos.routes.ts
// ─────────────────────────────────────────────────────────────
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const productos_service_1 = require("../services/productos.service");
const base_controller_1 = require("../controllers/base.controller");
const productosRouter = (0, express_1.Router)();
productosRouter.use(auth_middleware_1.authenticate);
const productoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    descripcion: zod_1.z.string().optional(),
    precioVenta: zod_1.z.number().positive(),
    precioDecoracion: zod_1.z.number().positive(),
    estado: zod_1.z.nativeEnum(client_1.EstadoProducto).optional(),
});
productosRouter.get('/', (req, res, next) => (0, base_controller_1.handleListar)(req, res, next, (p) => productos_service_1.productosService.listar(p)));
productosRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), (req, res, next) => (0, base_controller_1.handleCrear)(req, res, next, (d) => productos_service_1.productosService.crear(d), productoSchema));
productosRouter.get('/:id', (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => productos_service_1.productosService.obtenerPorId(id)));
productosRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), (req, res, next) => (0, base_controller_1.handleActualizar)(req, res, next, (id, d) => productos_service_1.productosService.actualizar(id, d), productoSchema.partial()));
productosRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => (0, base_controller_1.handleEliminar)(req, res, next, (id) => productos_service_1.productosService.eliminar(id)));
exports.default = productosRouter;
// ─────────────────────────────────────────────────────────────
// clientes.routes.ts  (exportado al final del archivo)
// ─────────────────────────────────────────────────────────────
const clientes_service_1 = require("../services/clientes.service");
const clientesRouter = (0, express_1.Router)();
exports.clientesRouter = clientesRouter;
clientesRouter.use(auth_middleware_1.authenticate);
const clienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    documento: zod_1.z.string().min(3).max(20),
    direccion: zod_1.z.string().optional(),
    telefono: zod_1.z.string().optional(),
    transportadora: zod_1.z.string().optional(),
});
clientesRouter.get('/', (req, res, next) => (0, base_controller_1.handleListar)(req, res, next, (p) => clientes_service_1.clientesService.listar(p)));
clientesRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS'), (req, res, next) => (0, base_controller_1.handleCrear)(req, res, next, (d) => clientes_service_1.clientesService.crear(d), clienteSchema));
clientesRouter.get('/:id', (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => clientes_service_1.clientesService.obtenerPorId(id)));
clientesRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS'), (req, res, next) => (0, base_controller_1.handleActualizar)(req, res, next, (id, d) => clientes_service_1.clientesService.actualizar(id, d), clienteSchema.partial()));
clientesRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => (0, base_controller_1.handleEliminar)(req, res, next, (id) => clientes_service_1.clientesService.eliminar(id)));
const client_2 = require("@prisma/client");
const pedidos_service_1 = require("../services/pedidos.service");
const response_1 = require("../utils/response");
const base_controller_2 = require("../controllers/base.controller");
const pedidosRouter = (0, express_1.Router)();
exports.pedidosRouter = pedidosRouter;
pedidosRouter.use(auth_middleware_1.authenticate);
const pedidoSchema = zod_1.z.object({
    clienteId: zod_1.z.string().uuid(),
    cantidadPedido: zod_1.z.number().int().positive(),
    cantidadPlancha: zod_1.z.number().int().optional(),
    laser: zod_1.z.boolean().optional(),
    fechaInicioCorte: zod_1.z.coerce.date().optional(),
    observaciones: zod_1.z.string().optional(),
});
const actualizarPedidoSchema = zod_1.z.object({
    cantidadPlancha: zod_1.z.number().int().optional(),
    laser: zod_1.z.boolean().optional(),
    fechaInicioCorte: zod_1.z.coerce.date().optional(),
    fechaConteo: zod_1.z.coerce.date().optional(),
    cantidadTareas: zod_1.z.number().int().optional(),
    fechaAsignacion: zod_1.z.coerce.date().optional(),
    cantidadRecibida: zod_1.z.number().int().optional(),
    fechaDespacho: zod_1.z.coerce.date().optional(),
    cortes: zod_1.z.number().int().optional(),
    cantidadDespacho: zod_1.z.number().int().optional(),
    observaciones: zod_1.z.string().optional(),
});
pedidosRouter.get('/', async (req, res, next) => {
    try {
        const params = {
            ...(0, response_1.parsePagination)(req.query),
            estado: req.query.estado,
            clienteId: req.query.clienteId,
        };
        const result = await pedidos_service_1.pedidosService.listar(params);
        const { sendPaginated } = await Promise.resolve().then(() => __importStar(require('../utils/response')));
        sendPaginated(res, result, params);
    }
    catch (error) {
        next(error);
    }
});
pedidosRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS'), async (req, res, next) => {
    try {
        const dto = pedidoSchema.parse(req.body);
        const data = await pedidos_service_1.pedidosService.crear(dto);
        (0, response_1.sendSuccess)(res, data, 'Pedido creado exitosamente');
    }
    catch (error) {
        next(error);
    }
});
pedidosRouter.get('/estadisticas', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (_req, res, next) => {
    try {
        const data = await pedidos_service_1.pedidosService.estadisticas();
        (0, response_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
});
pedidosRouter.get('/:id', (req, res, next) => (0, base_controller_2.handleObtener)(req, res, next, (id) => pedidos_service_1.pedidosService.obtenerPorId(id)));
pedidosRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION', 'VENTAS'), async (req, res, next) => {
    try {
        const dto = actualizarPedidoSchema.parse(req.body);
        const data = await pedidos_service_1.pedidosService.actualizar(req.params.id, dto);
        (0, response_1.sendSuccess)(res, data, 'Pedido actualizado');
    }
    catch (error) {
        next(error);
    }
});
pedidosRouter.patch('/:id/estado', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), async (req, res, next) => {
    try {
        const { estado } = zod_1.z.object({ estado: zod_1.z.nativeEnum(client_2.EstadoPedido) }).parse(req.body);
        const data = await pedidos_service_1.pedidosService.cambiarEstado(req.params.id, estado);
        (0, response_1.sendSuccess)(res, data, `Estado cambiado a ${estado}`);
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=productos.routes.js.map