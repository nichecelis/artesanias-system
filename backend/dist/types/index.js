"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.EstadoPedidoEnum = void 0;
// ─── Roles del sistema (Const Types Pattern) ─────────────────
const ROLES = {
    ADMINISTRADOR: 'ADMINISTRADOR',
    PRODUCCION: 'PRODUCCION',
    CONTABILIDAD: 'CONTABILIDAD',
};
// ─── Estados de pedido (Const Types Pattern) ─────────────────
const ESTADOS_PEDIDO = {
    PENDIENTE: 'PENDIENTE',
    EN_CORTE: 'EN_CORTE',
    EN_DECORACION: 'EN_DECORACION',
    LISTO: 'LISTO',
    DESPACHADO: 'DESPACHADO',
    CANCELADO: 'CANCELADO',
};
var EstadoPedidoEnum;
(function (EstadoPedidoEnum) {
    EstadoPedidoEnum["PENDIENTE"] = "PENDIENTE";
    EstadoPedidoEnum["EN_CORTE"] = "EN_CORTE";
    EstadoPedidoEnum["EN_DECORACION"] = "EN_DECORACION";
    EstadoPedidoEnum["LISTO"] = "LISTO";
    EstadoPedidoEnum["DESPACHADO"] = "DESPACHADO";
    EstadoPedidoEnum["CANCELADO"] = "CANCELADO";
})(EstadoPedidoEnum || (exports.EstadoPedidoEnum = EstadoPedidoEnum = {}));
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