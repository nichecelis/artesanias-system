import { EstadoPedido } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip, generarCodigoPedido } from '../utils/response';

interface ProductoPedidoDto {
  productoId:      string;
  cantidadPedido:  number;
  cantidadPlancha?: number;
}

interface CrearPedidoDto {
  clienteId:        string;
  laser?:           boolean;
  fechaInicioCorte?: string;
  observaciones?:   string;
  productos:        ProductoPedidoDto[];
}

interface ActualizarPedidoDto {
  laser?:            boolean;
  fechaInicioCorte?: string;
  fechaConteo?:      string;
  cantidadTareas?:   number;
  fechaAsignacion?:  string;
  cantidadRecibida?: number;
  fechaDespacho?:    string;
  cortes?:           number;
  cantidadDespacho?: number;
  cantidadFaltante?: number;
  estado?:           EstadoPedido;
  observaciones?:    string;
  productos?:        ProductoPedidoDto[];
}

const INCLUDE_COMPLETO = {
  cliente:   { select: { id: true, nombre: true, documento: true, telefono: true } },
  productos: { include: { producto: { select: { id: true, nombre: true, precioVenta: true, precioDecoracion: true } } } },
  decoraciones: {
    include: {
      decoradora: { select: { id: true, nombre: true } },
      producto:   { select: { id: true, nombre: true } },
    },
  },
} as const;

export class PedidosService {

  async crear(dto: CrearPedidoDto) {
    const cliente = await prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente || !cliente.activo) throw new AppError(404, 'Cliente no encontrado');
    if (!dto.productos?.length) throw new AppError(400, 'El pedido debe tener al menos un producto');

    const count  = await prisma.pedido.count();
    const codigo = generarCodigoPedido(count + 1);
    const { productos, ...pedidoData } = dto;
    const fechas = ['fechaInicioCorte','fechaConteo','fechaAsignacion','fechaDespacho'];
    const data: any = { ...pedidoData, codigo };
    fechas.forEach(f => { if (data[f]) data[f] = new Date(data[f] + 'T00:00:00.000Z'); });

    return prisma.pedido.create({
      data: {
        ...data,
        productos: {
          create: productos.map(p => ({
            productoId:     p.productoId,
            cantidadPedido: p.cantidadPedido,
            cantidadPlancha: p.cantidadPlancha,
          })),
        },
      },
      include: INCLUDE_COMPLETO,
    });
  }

  async listar(params: PaginationParams & { estado?: EstadoPedido; clienteId?: string }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (params.estado)    where.estado    = params.estado;
    if (params.clienteId) where.clienteId = params.clienteId;
    if (params.search) {
      where.OR = [
        { codigo:  { contains: params.search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where,
        skip:    getPrismaSkip(params),
        take:    params.limit,
        orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder },
        include: {
          cliente:   { select: { id: true, nombre: true } },
          productos: { include: { producto: { select: { id: true, nombre: true } } } },
          _count:    { select: { decoraciones: true } },
        },
      }),
      prisma.pedido.count({ where }),
    ]);

    return { items, total };
  }

  async obtenerPorId(id: string) {
    const pedido = await prisma.pedido.findUnique({ where: { id }, include: INCLUDE_COMPLETO });
    if (!pedido) throw new AppError(404, 'Pedido no encontrado');
    return pedido;
  }

  async actualizar(id: string, dto: ActualizarPedidoDto) {
    await this.obtenerPorId(id);
    const { productos, ...pedidoData } = dto;

    if (productos !== undefined) {
      await prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } });
      if (productos.length > 0) {
        await prisma.pedidoProducto.createMany({
          data: productos.map(p => ({
            pedidoId:       id,
            productoId:     p.productoId,
            cantidadPedido: p.cantidadPedido,
            cantidadPlancha: p.cantidadPlancha,
          })),
        });
      }
    }

    const fechas = ['fechaInicioCorte','fechaConteo','fechaAsignacion','fechaDespacho'];
    const dataFinal: any = { ...pedidoData };
    fechas.forEach(f => { if (dataFinal[f]) dataFinal[f] = new Date(dataFinal[f] + 'T00:00:00.000Z'); });
    return prisma.pedido.update({ where: { id }, data: dataFinal, include: INCLUDE_COMPLETO });
  }

  async cambiarEstado(id: string, estado: EstadoPedido) {
    await this.obtenerPorId(id);
    return prisma.pedido.update({
      where: { id }, data: { estado },
      include: { cliente: { select: { id: true, nombre: true } } },
    });
  }

  async estadisticas() {
    const [porEstado, totalMes] = await prisma.$transaction([
      prisma.pedido.groupBy({ by: ['estado'], _count: { id: true } }),
      prisma.pedido.count({
        where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
    ]);
    return { porEstado, totalMes };
  }
}

export const pedidosService = new PedidosService();
