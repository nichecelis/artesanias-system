"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosController = exports.PedidosController = void 0;
const pedidos_service_1 = require("../services/pedidos.service");
const response_1 = require("../utils/response");
class PedidosController {
    async obtenerPorId(req, res, next) {
        try {
            const { id } = req.params;
            console.log('📨 GET /pedidos/:id -', id);
            const pedido = await pedidos_service_1.pedidosService.obtenerPorId(id);
            (0, response_1.sendSuccess)(res, pedido, 'Pedido obtenido correctamente', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async listar(req, res, next) {
        try {
            console.log('📨 GET /pedidos - Query:', req.query);
            const result = await pedidos_service_1.pedidosService.listar(req.query);
            (0, response_1.sendSuccess)(res, result, 'Pedidos obtenidos correctamente', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async crear(req, res, next) {
        try {
            console.log('📨 POST /pedidos - Body:', req.body);
            const pedido = await pedidos_service_1.pedidosService.crear(req.body);
            (0, response_1.sendSuccess)(res, pedido, 'Pedido creado correctamente', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            console.log('📨 PUT /pedidos/:id -', id);
            const pedido = await pedidos_service_1.pedidosService.actualizar(id, req.body);
            (0, response_1.sendSuccess)(res, pedido, 'Pedido actualizado correctamente', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async cambiarEstado(req, res, next) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            console.log('📨 PATCH /pedidos/:id/estado -', id, estado);
            const pedido = await pedidos_service_1.pedidosService.cambiarEstado(id, estado);
            (0, response_1.sendSuccess)(res, pedido, 'Estado del pedido actualizado', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PedidosController = PedidosController;
exports.pedidosController = new PedidosController();
//# sourceMappingURL=pedidos.controller.js.map