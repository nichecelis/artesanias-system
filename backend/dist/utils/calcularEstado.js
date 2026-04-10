"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularEstado = calcularEstado;
const types_1 = require("../types");
function calcularEstado(p) {
    if (p.cantidadDespacho && p.cantidadPedido && p.cantidadDespacho >= p.cantidadPedido) {
        return types_1.EstadoPedidoEnum.DESPACHADO;
    }
    if (p.fechaDespacho)
        return types_1.EstadoPedidoEnum.LISTO;
    if (p.fechaAsignacion) {
        if (p.cantidadRecibida && p.cantidadRecibida > 0 && !p.fechaDespacho)
            return types_1.EstadoPedidoEnum.EN_DECORACION;
        if (p.fechaAsignacion && !p.fechaDespacho)
            return types_1.EstadoPedidoEnum.EN_DECORACION;
    }
    if (p.fechaInicioCorte)
        return types_1.EstadoPedidoEnum.EN_CORTE;
    return types_1.EstadoPedidoEnum.PENDIENTE;
}
//# sourceMappingURL=calcularEstado.js.map