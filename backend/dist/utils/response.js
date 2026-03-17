"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = void 0;
exports.sendError = sendError;
exports.sendCreated = sendCreated;
exports.sendPaginated = sendPaginated;
exports.parsePagination = parsePagination;
exports.getPrismaSkip = getPrismaSkip;
exports.generarCodigoPedido = generarCodigoPedido;
// ─── Respuestas HTTP estandarizadas ──────────────────────────
const sendSuccess = (res, data, message = 'Operación exitosa', // <--- Añade un valor por defecto
statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};
exports.sendSuccess = sendSuccess;
function sendError(res, statusCode, message, errors) {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
}
function sendCreated(res, data, message = 'Creado exitosamente') {
    return (0, exports.sendSuccess)(res, data, message, 201);
}
function sendPaginated(res, result, params) {
    const totalPages = Math.ceil(result.total / params.limit);
    const meta = {
        total: result.total,
        page: params.page,
        limit: params.limit,
        totalPages,
    };
    return res.status(200).json({
        success: true,
        data: result.items,
        meta,
    });
}
// ─── Parsear parámetros de paginación del request ────────────
function parsePagination(query) {
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10)));
    return {
        page,
        limit,
        search: query.search ? String(query.search) : undefined,
        sortBy: query.sortBy ? String(query.sortBy) : undefined,
        sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
    };
}
// ─── Calcular offset para Prisma ─────────────────────────────
function getPrismaSkip(params) {
    return (params.page - 1) * params.limit;
}
// ─── Generar código de pedido autoincrementado ───────────────
function generarCodigoPedido(numero) {
    const year = new Date().getFullYear();
    const padded = String(numero).padStart(5, '0');
    return `ART-${year}-${padded}`;
}
//# sourceMappingURL=response.js.map