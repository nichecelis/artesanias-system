"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularEstado = calcularEstado;
function calcularEstado(p) {
    if (p.fechaDespacho)
        return 'DESPACHADO';
    if (p.fechaAsignacion)
        return 'EN_DECORACION';
    if (p.fechaInicioCorte)
        return 'EN_CORTE';
    return 'PENDIENTE';
}
//# sourceMappingURL=calcularEstado.js.map