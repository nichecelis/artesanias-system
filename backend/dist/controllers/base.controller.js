"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.idParamSchema = void 0;
exports.validateBody = validateBody;
exports.validateParams = validateParams;
exports.handleListar = handleListar;
exports.handleObtener = handleObtener;
exports.handleCrear = handleCrear;
exports.handleActualizar = handleActualizar;
exports.handleEliminar = handleEliminar;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
// ─── Schemas de validación reutilizables ─────────────────────
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('ID inválido'),
});
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
// ─── Decoradores de validación ────────────────────────────────
function validateBody(schema) {
    return async (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
function validateParams(schema) {
    return async (req, _res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
// ─── Helpers de controller ────────────────────────────────────
async function handleListar(req, res, next, serviceFn, extraParams = {}) {
    try {
        const params = { ...(0, response_1.parsePagination)(req.query), ...extraParams };
        const result = await serviceFn(params);
        (0, response_1.sendPaginated)(res, result, params);
    }
    catch (error) {
        next(error);
    }
}
async function handleObtener(req, res, next, serviceFn) {
    try {
        const { id } = exports.idParamSchema.parse(req.params);
        const data = await serviceFn(id);
        (0, response_1.sendSuccess)(res, data, 'Obtenido exitosamente', 200);
    }
    catch (error) {
        next(error);
    }
}
async function handleCrear(req, res, next, serviceFn, schema) {
    try {
        const dto = schema ? schema.parse(req.body) : req.body;
        const data = await serviceFn(dto);
        (0, response_1.sendCreated)(res, data, 'Creado exitosamente');
    }
    catch (error) {
        next(error);
    }
}
async function handleActualizar(req, res, next, serviceFn, schema) {
    try {
        const { id } = exports.idParamSchema.parse(req.params);
        const dto = schema ? schema.parse(req.body) : req.body;
        const data = await serviceFn(id, dto);
        (0, response_1.sendSuccess)(res, data, 'Actualizado exitosamente', 200);
    }
    catch (error) {
        next(error);
    }
}
async function handleEliminar(req, res, next, serviceFn, extraArgs = []) {
    try {
        const { id } = exports.idParamSchema.parse(req.params);
        await serviceFn(id, ...extraArgs);
        (0, response_1.sendSuccess)(res, null, 'Eliminado exitosamente', 200);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=base.controller.js.map