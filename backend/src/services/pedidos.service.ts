import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, EstadoPedido, EstadoPedidoEnum } from '../types';
import { calcularEstado } from '../utils/calcularEstado';

 /**
 * 🔥 Calcula estado global del pedido
 */
 
 function calcularEstadoPedido(productos: any[]): EstadoPedidoEnum {

  if (productos.every(p => calcularEstado(p) === EstadoPedidoEnum.DESPACHADO)) {
    return EstadoPedidoEnum.DESPACHADO;
  }

  if (productos.every(p => [EstadoPedidoEnum.LISTO, EstadoPedidoEnum.DESPACHADO].includes(calcularEstado(p)))) {
    return EstadoPedidoEnum.LISTO;
  }

  if (productos.some(p => calcularEstado(p) === EstadoPedidoEnum.EN_DECORACION)) {
    return EstadoPedidoEnum.EN_DECORACION;
  }

  if (productos.some(p => calcularEstado(p) === EstadoPedidoEnum.EN_CORTE)) {
    return EstadoPedidoEnum.EN_CORTE;
  }

  return EstadoPedidoEnum.PENDIENTE;
}

/**
 * 🔥 MAPEO CORRECTO - Calcula estado automáticamente
 */
function mapProducto(p: any) {

  const cantidadPedido = Number(p.cantidadPedido || 0);
  const cantidadDespacho = Number(p.cantidadDespacho || 0);

  const estadoCalculado = calcularEstado(p);

  return {
    productoId: p.productoId,
    cantidadPedido,
    cantidadPlancha: p.cantidadPlancha ? Number(p.cantidadPlancha) : null,

    // 🔥 CORTE
    fechaInicioCorte: p.fechaInicioCorte ? new Date(p.fechaInicioCorte) : null,
    fechaConteo: p.fechaConteo ? new Date(p.fechaConteo) : null,
    cantidadTareas: p.cantidadTareas ? Number(p.cantidadTareas) : null,

    corte1: p.corte1 ? Number(p.corte1) : null,
    corte2: p.corte2 ? Number(p.corte2) : null,
    corte3: p.corte3 ? Number(p.corte3) : null,

    // 🔥 DECORACIÓN
    fechaAsignacion: p.fechaAsignacion ? new Date(p.fechaAsignacion) : null,
    cantidadRecibida: p.cantidadRecibida ? Number(p.cantidadRecibida) : null,

    // 🔥 DESPACHO
    fechaDespacho: p.fechaDespacho ? new Date(p.fechaDespacho) : null,
    cantidadDespacho,
    cantidadFaltante: cantidadDespacho - cantidadPedido,

    estado: estadoCalculado
  };
}

export class PedidosService {

  async obtenerPorId(id: string) {
    if (!id) throw new AppError('ID requerido', 400);

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        productos: { include: { producto: true } }
      }
    });

    if (!pedido) throw new AppError('Pedido no encontrado', 404);

    const productos = pedido.productos.map(p => ({
      ...p,
      estadoCalculado: calcularEstado(p)
    }));

    return {
      ...pedido,
      estadoCalculado: calcularEstadoPedido(productos),
      productos
    };
  }

  async listar(filtros: any) {
    const page = Number(filtros.page) || 1;
    const limit = Number(filtros.limit) || 20;

    const where: Prisma.PedidoWhereInput = {};

    if (filtros.search) {
      where.OR = [
        { codigo: { contains: filtros.search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: filtros.search, mode: 'insensitive' } } }
      ];
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.proceso) {
      switch (filtros.proceso) {
        case 'sin_corte':
          where.productos = { some: { fechaInicioCorte: null } };
          break;
        case 'en_corte':
          where.productos = { some: { fechaInicioCorte: { not: null }, fechaAsignacion: null } };
          break;
        case 'sin_decoracion':
          where.productos = { some: { fechaAsignacion: null } };
          break;
        case 'en_decoracion':
          where.productos = { some: { fechaAsignacion: { not: null }, fechaDespacho: null } };
          break;
        case 'sin_despacho':
          where.productos = { some: { fechaDespacho: null } };
          break;
        case 'despachados':
          where.productos = { some: { fechaDespacho: { not: null } } };
          break;
      }
    }

    const [total, pedidos] = await prisma.$transaction([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where,
        include: {
          cliente: true,
          productos: { include: { producto: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      success: true,
      data: pedidos.map(pedido => {
        const productos = pedido.productos.map(p => ({
          ...p,
          estadoCalculado: calcularEstado(p)
        }));

        return {
          ...pedido,
          estadoCalculado: calcularEstadoPedido(productos),
          productos
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async crear(data: any) {
    if (!data.productos?.length) {
      throw new AppError("Debe incluir productos", 400);
    }

    if (!data.clienteId) {
      throw new AppError("Cliente requerido", 400);
    }

    const count = await prisma.pedido.count();
    const codigo = `PED-${(count + 1).toString().padStart(3, '0')}`;

    const pedido = await prisma.pedido.create({
      data: {
        codigo,
        clienteId: data.clienteId,
        laser: data.laser || null,
        estado: EstadoPedidoEnum.PENDIENTE,
        observaciones: data.observaciones,

        productos: {
          create: data.productos.map(mapProducto)
        }
      },
      include: { productos: true }
    });

    // 🔥 recalcular estado
    const estado = calcularEstadoPedido(
      pedido.productos.map(p => ({ ...p, estadoCalculado: calcularEstado(p) }))
    );

    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { estado: estado as any }
    });

    return pedido;
  }

  async actualizar(id: string, data: any) {

    await this.obtenerPorId(id);

    const { productos, ...resto } = data;

    if (productos) {
      await prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } });

      (resto as any).productos = {
        create: productos.map(mapProducto)
      };
    }

    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        ...resto,
        laser: resto.laser || null
      },
      include: { productos: true }
    });

    // 🔥 recalcular estado
    const estado = calcularEstadoPedido(
      pedido.productos.map(p => ({ ...p, estadoCalculado: calcularEstado(p) }))
    );

    await prisma.pedido.update({
      where: { id },
      data: { estado: estado as any }
    });

    return pedido;
  }

  async actualizarSeguimientoProducto(id: string, data: any) {

    const cantidadPedido = Number(data.cantidadPedido || 0);
    const cantidadDespacho = Number(data.cantidadDespacho || 0);

    const producto = await prisma.pedidoProducto.update({
      where: { id },
      data: {
        fechaInicioCorte: data.fechaInicioCorte ? new Date(data.fechaInicioCorte) : undefined,
        fechaConteo: data.fechaConteo ? new Date(data.fechaConteo) : undefined,
        fechaAsignacion: data.fechaAsignacion ? new Date(data.fechaAsignacion) : undefined,
        fechaDespacho: data.fechaDespacho ? new Date(data.fechaDespacho) : undefined,

        cantidadTareas: data.cantidadTareas ? Number(data.cantidadTareas) : undefined,

        corte1: data.corte1 ? Number(data.corte1) : undefined,
        corte2: data.corte2 ? Number(data.corte2) : undefined,
        corte3: data.corte3 ? Number(data.corte3) : undefined,

        cantidadRecibida: data.cantidadRecibida ? Number(data.cantidadRecibida) : undefined,

        cantidadDespacho,
        cantidadFaltante: cantidadDespacho - cantidadPedido
      }
    });

    // 🔥 recalcular pedido
    const productos = await prisma.pedidoProducto.findMany({
      where: { pedidoId: producto.pedidoId }
    });

    const estado = calcularEstadoPedido(
      productos.map(p => ({ ...p, estadoCalculado: calcularEstado(p) }))
    );

    await prisma.pedido.update({
      where: { id: producto.pedidoId },
      data: { estado: estado as any }
    });

    return producto;
  }

  async cambiarEstado(id: string, estado: string) {
    if (!Object.values(EstadoPedidoEnum).includes(estado as EstadoPedidoEnum)) {
      throw new AppError('Estado inválido', 400);
    }

    return prisma.pedido.update({
      where: { id },
      data: { estado: estado as any }
    });
  }

  /**
   * 🔥 ESTADÍSTICAS (FIX TYPE SAFE)
   */
  async estadisticas() {
    const [porEstadoRaw, totalMes, total] = await prisma.$transaction([
      prisma.pedido.groupBy({
        by: ['estado'],
        _count: { id: true },
        orderBy: undefined
      }),
      prisma.pedido.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.pedido.count()
    ]);

    const porEstado = porEstadoRaw as Array<{
      estado: EstadoPedido;
      _count: { id: number };
    }>;

    return {
      success: true,
      resumen: { total, totalMes },
      porEstado: porEstado.map(e => ({
        estado: e.estado,
        cantidad: e._count.id
      }))
    };
  }
}

export const pedidosService = new PedidosService();
