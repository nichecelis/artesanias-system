import { Prisma, EstadoPedido } from '@prisma/client';

export function calcularEstado(p: any): EstadoPedido {
  if (p.fechaDespacho) return 'DESPACHADO';
  if (p.fechaAsignacion) return 'EN_DECORACION';
  if (p.fechaInicioCorte) return 'EN_CORTE';
  return 'PENDIENTE';
}
