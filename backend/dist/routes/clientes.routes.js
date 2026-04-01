"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─────────────────────────────────────────────────────────────
// clientes.routes.ts
// ─────────────────────────────────────────────────────────────
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const clientes_service_1 = require("../services/clientes.service");
const base_controller_1 = require("../controllers/base.controller");
const clientesRouter = (0, express_1.Router)();
clientesRouter.use(auth_middleware_1.authenticate);
const clienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2).max(200),
    documento: zod_1.z.string().min(3).max(20),
    direccion: zod_1.z.string().optional(),
    telefono: zod_1.z.string().optional(),
    transportadora: zod_1.z.string().optional(),
});
clientesRouter.get('/', (req, res, next) => {
    const { parsePagination } = require('../utils/response');
    const params = { ...parsePagination(req.query), activo: req.query.activo };
    clientes_service_1.clientesService.listar(params)
        .then(result => res.json({ success: true, data: result.items, meta: {
            total: result.total, page: params.page, limit: params.limit,
            totalPages: Math.ceil(result.total / params.limit),
        } }))
        .catch(next);
});
clientesRouter.post('/', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => (0, base_controller_1.handleCrear)(req, res, next, (d) => clientes_service_1.clientesService.crear(d), clienteSchema));
clientesRouter.get('/documento/:documento', (req, res, next) => {
    const { sendSuccess } = require('../utils/response');
    clientes_service_1.clientesService.obtenerPorDocumento(req.params.documento)
        .then(data => sendSuccess(res, data))
        .catch(next);
});
clientesRouter.patch('/documento/:documento', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => {
    const { sendSuccess } = require('../utils/response');
    clientes_service_1.clientesService.actualizarPorDocumento(req.params.documento, req.body)
        .then(data => sendSuccess(res, data, 'Cliente actualizado'))
        .catch(next);
});
clientesRouter.delete('/documento/:documento', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => {
    const { sendSuccess } = require('../utils/response');
    clientes_service_1.clientesService.eliminarPorDocumento(req.params.documento)
        .then(data => sendSuccess(res, data, 'Cliente desactivado'))
        .catch(next);
});
clientesRouter.get('/:id', (req, res, next) => (0, base_controller_1.handleObtener)(req, res, next, (id) => clientes_service_1.clientesService.obtenerPorId(id)));
clientesRouter.patch('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => (0, base_controller_1.handleActualizar)(req, res, next, (id, d) => clientes_service_1.clientesService.actualizar(id, d), clienteSchema.partial()));
clientesRouter.delete('/:id', (0, auth_middleware_1.authorize)('ADMINISTRADOR'), (req, res, next) => (0, base_controller_1.handleEliminar)(req, res, next, (id) => clientes_service_1.clientesService.eliminar(id)));
exports.default = clientesRouter;
//# sourceMappingURL=clientes.routes.js.map