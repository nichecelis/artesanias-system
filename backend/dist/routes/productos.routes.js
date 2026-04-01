"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
productosRouter.get('/', (req, res, next) => {
    const { parsePagination } = require('../utils/response');
    const params = { ...parsePagination(req.query), estado: req.query.estado };
    productos_service_1.productosService.listar(params)
        .then(result => res.json({ success: true, data: result.items, meta: {
            total: result.total, page: params.page, limit: params.limit,
            totalPages: Math.ceil(result.total / params.limit),
        } }))
        .catch(next);
});
productosRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), (req, res, next) => (0, base_controller_1.handleCrear)(req, res, next, (d) => productos_service_1.productosService.crear(d), productoSchema));
productosRouter.get('/:id', (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => productos_service_1.productosService.obtenerPorId(id)));
productosRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'PRODUCCION'), (req, res, next) => (0, base_controller_1.handleActualizar)(req, res, next, (id, d) => productos_service_1.productosService.actualizar(id, d), productoSchema.partial()));
productosRouter.patch('/:id/inactivar', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => {
    const { sendSuccess } = require('../utils/response');
    productos_service_1.productosService.inactivar(req.params.id)
        .then(data => sendSuccess(res, data, 'Producto inactivado'))
        .catch(next);
});
productosRouter.patch('/:id/activar', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => {
    const { sendSuccess } = require('../utils/response');
    productos_service_1.productosService.activar(req.params.id)
        .then(data => sendSuccess(res, data, 'Producto activado'))
        .catch(next);
});
productosRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => (0, base_controller_1.handleEliminar)(req, res, next, (id) => productos_service_1.productosService.eliminar(id)));
exports.default = productosRouter;
//# sourceMappingURL=productos.routes.js.map