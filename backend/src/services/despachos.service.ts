import { prisma } from '../config/database';
import { AppError, PaginationParams } from '../types';

export class DespachosService {

  async listar(params: PaginationParams & {
    search?: string;
    clienteId?: string;
    estado?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.clienteId) where.pedido = { clienteId: params.clienteId };
    if (params.search) {
      where.OR = [
        { pedido: { codigo: { contains: params.search, mode: 'insensitive' } } },
        { pedido: { cliente: { nombre: { contains: params.search, mode: 'insensitive' } } } },
        { producto: { nombre: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    where.cantidadRecibida = { gt: 0 };

    const [items, total] = await Promise.all([
      prisma.pedidoProducto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pedido: {
            include: {
              cliente: true,
            }
          },
          producto: {
            select: { id: true, nombre: true }
          },
        },
      }),
      prisma.pedidoProducto.count({ where }),
    ]);

    const itemsConEstado = items.map(pp => ({
      ...pp,
      estadoCalculado: this.calcularEstadoDespacho(pp),
    }));

    return { items: itemsConEstado, total, page, limit };
  }

  private calcularEstadoDespacho(pp: any): string {
    if (pp.estado === 'DESPACHADO') return 'DESPACHADO';
    if (!pp.cantidadRecibida) return 'SIN_INGRESO';
    const despachado = pp.cantidadDespacho || 0;
    const pedido = pp.cantidadPedido;
    if (despachado >= pedido) return 'COMPLETO';
    if (despachado > 0) return 'PARCIAL';
    return 'PENDIENTE';
  }

  async obtenerPorId(id: string) {
    const pp = await prisma.pedidoProducto.findUnique({
      where: { id },
      include: {
        pedido: {
          include: {
            cliente: true,
          }
        },
        producto: true,
      },
    });
    if (!pp) throw new AppError('Producto no encontrado', 404);
    return pp;
  }

  async registrarDespacho(id: string, dto: {
    caja1Fecha?: string;
    caja1Cantidad?: number;
    caja2Fecha?: string;
    caja2Cantidad?: number;
    caja3Fecha?: string;
    caja3Cantidad?: number;
  }) {
    const pp = await prisma.pedidoProducto.findUnique({
      where: { id },
      include: {
        pedido: true,
      },
    });
    if (!pp) throw new AppError('Producto no encontrado', 404);
    if (!pp.cantidadRecibida) throw new AppError('El producto no tiene ingreso de decoración registrado', 400);

    let cantidadDespacho = pp.cantidadDespacho || 0;
    let fechaDespacho = pp.fechaDespacho;

    const cajas = [
      { fecha: dto.caja1Fecha, cantidad: dto.caja1Cantidad },
      { fecha: dto.caja2Fecha, cantidad: dto.caja2Cantidad },
      { fecha: dto.caja3Fecha, cantidad: dto.caja3Cantidad },
    ];

    for (const caja of cajas) {
      if (caja.fecha && caja.cantidad && caja.cantidad > 0) {
        cantidadDespacho += caja.cantidad;
        
        const [y, m, d] = caja.fecha.split('-');
        const fechaCaja = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        
        if (!fechaDespacho || fechaCaja > fechaDespacho) {
          fechaDespacho = fechaCaja;
        }
      }
    }

    cantidadDespacho = Math.min(cantidadDespacho, pp.cantidadPedido);
    const cantidadFaltante = pp.cantidadPedido - cantidadDespacho;
    const estado = cantidadDespacho >= pp.cantidadPedido ? 'DESPACHADO' : 'LISTO';

    return prisma.$transaction(async (tx) => {
      const updated = await tx.pedidoProducto.update({
        where: { id },
        data: {
          cantidadDespacho,
          cantidadFaltante,
          fechaDespacho,
          estado,
        },
        include: {
          pedido: {
            include: {
              cliente: true,
            }
          },
          producto: true,
        },
      });

      await tx.pedido.update({
        where: { id: pp.pedidoId },
        data: { estado },
      });

      return updated;
    });
  }
}

export const despachosService = new DespachosService();
