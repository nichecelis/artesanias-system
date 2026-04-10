import { EstadoPedido, EstadoPedidoEnum } from '../types';

export function calcularEstado(p: any): EstadoPedido {
  if (p.cantidadDespacho && p.cantidadPedido && p.cantidadDespacho >= p.cantidadPedido) {
    return EstadoPedidoEnum.DESPACHADO;
  }
  if (p.fechaDespacho) return EstadoPedidoEnum.LISTO;
  if (p.fechaAsignacion) {
    if (p.cantidadRecibida && p.cantidadRecibida > 0 && !p.fechaDespacho) return EstadoPedidoEnum.EN_DECORACION;
    if (p.fechaAsignacion && !p.fechaDespacho) return EstadoPedidoEnum.EN_DECORACION;
  }
  if (p.fechaInicioCorte) return EstadoPedidoEnum.EN_CORTE;
  return EstadoPedidoEnum.PENDIENTE;
}
