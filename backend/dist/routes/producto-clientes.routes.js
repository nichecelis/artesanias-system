"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productoClientesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const producto_clientes_service_1 = require("../services/producto-clientes.service");
const response_1 = require("../utils/response");
exports.productoClientesRouter = (0, express_1.Router)();
exports.productoClientesRouter.use(auth_middleware_1.authenticate);
const precioSchema = zod_1.z.object({ precioVenta: zod_1.z.number().positive() });
// Precios de un producto
exports.productoClientesRouter.get('/producto/:productoId', async (req, res, next) => {
    try {
        const data = await producto_clientes_service_1.productoClientesService.listarPorProducto(req.params.productoId);
        // Agregamos el mensaje "Precios del producto" como tercer argumento
        (0, response_1.sendSuccess)(res, data, 'Precios del producto');
    }
    catch (e) {
        next(e);
    }
});
// Precios de un cliente
exports.productoClientesRouter.get('/cliente/:clienteId', async (req, res, next) => {
    try {
        const data = await producto_clientes_service_1.productoClientesService.listarPorCliente(req.params.clienteId);
        // Agregamos el mensaje "Precios del cliente"
        (0, response_1.sendSuccess)(res, data, 'Precios del cliente');
    }
    catch (e) {
        next(e);
    }
});
// Crear/actualizar precio
exports.productoClientesRouter.put('/:clienteId/:productoId', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS'), async (req, res, next) => {
    try {
        const { precioVenta } = precioSchema.parse(req.body);
        // Usar el nombre exacto del modelo: productoCliente (camelCase)
        const data = await producto_clientes_service_1.productoClientesService.upsert(req.params.productoId, req.params.clienteId, precioVenta);
        res.status(200).json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
// Eliminar precio
exports.productoClientesRouter.delete('/:productoId/:clienteId', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'VENTAS'), async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, await producto_clientes_service_1.productoClientesService.eliminar(req.params.productoId, req.params.clienteId), 'Precio eliminado');
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=producto-clientes.routes.js.map