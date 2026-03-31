"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularEstado = calcularEstado;
function calcularEstado(p) {
    if (p.cantidadDespacho && p.cantidadPedido && p.cantidadDespacho >= p.cantidadPedido) {
        return 'DESPACHADO';
    }
    if (p.fechaDespacho)
        return 'LISTO';
    if (p.fechaAsignacion) {
        if (p.cantidadRecibida && p.cantidadRecibida > 0 && !p.fechaDespacho)
            return 'EN_DECORACION';
        if (p.fechaAsignacion && !p.fechaDespacho)
            return 'EN_DECORACION';
    }
    if (p.fechaInicioCorte)
        return 'EN_CORTE';
    return 'PENDIENTE';
}
//# sourceMappingURL=calcularEstado.js.map