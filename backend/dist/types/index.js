"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// ─── Roles del sistema (Const Types Pattern) ─────────────────
const ROLES = {
    ADMINISTRADOR: 'ADMINISTRADOR',
    PRODUCCION: 'PRODUCCION',
    CONTABILIDAD: 'CONTABILIDAD',
};
// ─── Estados de pedido (Const Types Pattern) ─────────────────
const ESTADOS_PEDIDO = {
    PENDIENTE: 'PENDIENTE',
    EN_PROCESO: 'EN_PROCESO',
    TERMINADO: 'TERMINADO',
    DESPACHADO: 'DESPACHADO',
    CANCELADO: 'CANCELADO',
};
// ─── Estados de producto (Const Types Pattern) ────────────────
const ESTADOS_PRODUCTO = {
    PENDIENTE: 'PENDIENTE',
    CORTE: 'CORTE',
    ENSAMBLE: 'ENSAMBLE',
    DECORACION: 'DECORACION',
    TERMINADO: 'TERMINADO',
    CANCELADO: 'CANCELADO',
};
// ─── Tipos de grupo (Const Types Pattern) ────────────────────
const TIPOS_GRUPO = {
    GRUPO: 'GRUPO',
    ELITE: 'ELITE',
};
// ─── Error de la app ─────────────────────────────────────────
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=index.js.map