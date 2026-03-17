import { Prisma, EstadoPedido } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../types';
import { calcularEstado } from './utils/calcularEstado';

export class PedidosService {
  async obtenerPorId(id: string) {
    console.log('🔍 Buscando pedido con ID:', id);
    
    // Validar que el ID no esté vacío
    if (!id || id.trim() === '') {
      throw new AppError('ID de pedido requerido', 400);
    }

    try {
      const pedido = await prisma.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          productos: {
            include: { producto: true }
          }
        }
      });

      if (!pedido) {
        console.log('❌ Pedido no encontrado:', id);
        throw new AppError('Pedido no encontrado', 404);
      }

      console.log('✅ Pedido encontrado:', pedido.codigo);
      return pedido;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('❌ Error en obtenerPorId:', error);
      throw new AppError('Error al obtener el pedido', 500);
    }
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

    if (filtros.fechaDesde || filtros.fechaHasta) {
      const rango: any = {};

      if (filtros.fechaDesde) {
        const [y, m, d] = filtros.fechaDesde.split('-').map(Number);
        rango.gte = new Date(y, m - 1, d, 0, 0, 0, 0); // inicio del día local
      }

      if (filtros.fechaHasta) {
        const [y, m, d] = filtros.fechaHasta.split('-').map(Number);
        rango.lte = new Date(y, m - 1, d, 23, 59, 59, 999); // fin del día local
      }

      where.createdAt = rango;
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
      data: pedidos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async estadisticas() {
    const [porEstado, totalMes] = await prisma.$transaction([
      prisma.pedido.groupBy({
        by: ['estado'],
        _count: { id: true },
        orderBy: undefined
      }),
      prisma.pedido.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      })
    ]);

    return { 
      success: true,
      porEstado: porEstado.map((e: any) => ({ 
        estado: e.estado, 
        cantidad: e._count?.id || 0 
      })), 
      totalMes 
    };
  }

  async crear(data: any) {
    // Validar que productos es un array
    if (!data.productos || !Array.isArray(data.productos) || data.productos.length === 0) {
      throw new AppError("El pedido debe incluir al menos un producto", 400);
    }

    // Validar que clienteId existe
    if (!data.clienteId) {
      throw new AppError("El cliente es requerido", 400);
    }

    const count = await prisma.pedido.count();
    const codigo = `PED-${(count + 1).toString().padStart(3, '0')}`;

    return prisma.pedido.create({
      data: {
        codigo,
        clienteId: data.clienteId,
        estado: data.estado || 'PENDIENTE',
        productos: {
          create: data.productos.map((p: any) => ({
            productoId:       p.productoId,
            cantidadPedido:   Number(p.cantidadPedido),
            cantidadPlancha:  Number(p.cantidadPlancha || 0),

            // 🔥 CORTE
            fechaInicioCorte: p.fechaInicioCorte ? new Date(p.fechaInicioCorte) : null,
            fechaConteo:      p.fechaConteo ? new Date(p.fechaConteo) : null,
            cantidadTareas:   p.cantidadTareas ? Number(p.cantidadTareas) : null,
            cortes:           p.cortes ? Number(p.cortes) : null,

            // 🔥 DECORACIÓN
            fechaAsignacion:  p.fechaAsignacion ? new Date(p.fechaAsignacion) : null,
            cantidadRecibida: p.cantidadRecibida ? Number(p.cantidadRecibida) : null,

            // 🔥 DESPACHO
            fechaDespacho:    p.fechaDespacho ? new Date(p.fechaDespacho) : null,
            cantidadDespacho: p.cantidadDespacho ? Number(p.cantidadDespacho) : null,
            cantidadFaltante: p.cantidadFaltante ? Number(p.cantidadFaltante) : null,

            estado: p.estado || 'PENDIENTE'
          }))
        }
      },
      include: { cliente: true, productos: { include: { producto: true } } }
    });
  }

  async actualizar(id: string, data: any) {
    const pedido = await this.obtenerPorId(id);
    const { productos, ...resto } = data;

    // Actualización de productos con sus nuevos campos de seguimiento
    if (productos && Array.isArray(productos)) {
      // Para simplificar, si envías la lista de productos, recreamos el seguimiento
      // O puedes implementar una lógica de actualización por ID de PedidoProducto
      await prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } });
      
      (resto as any).productos = {
        create: productos.map((p: any) => ({
          productoId:       p.productoId,
          cantidadPedido:   Number(p.cantidadPedido),
          cantidadPlancha:  Number(p.cantidadPlancha || 0),

          estado: p.estado || 'PENDIENTE',

          // 🔥 CORTE
          fechaInicioCorte: p.fechaInicioCorte ? new Date(p.fechaInicioCorte) : null,
          fechaConteo:      p.fechaConteo ? new Date(p.fechaConteo) : null,
          cantidadTareas:   p.cantidadTareas ? Number(p.cantidadTareas) : null,
          cortes:           p.cortes ? Number(p.cortes) : null,

          // 🔥 DECORACIÓN
          fechaAsignacion:  p.fechaAsignacion ? new Date(p.fechaAsignacion) : null,
          cantidadRecibida: p.cantidadRecibida ? Number(p.cantidadRecibida) : null,

          // 🔥 DESPACHO
          fechaDespacho:    p.fechaDespacho ? new Date(p.fechaDespacho) : null,
          cantidadDespacho: p.cantidadDespacho ? Number(p.cantidadDespacho) : null,
          cantidadFaltante: p.cantidadFaltante ? Number(p.cantidadFaltante) : null,
        }))
      };
    }

    return prisma.pedido.update({
      where: { id },
      data: resto,
      include: { cliente: true, productos: { include: { producto: true } } }
    });
  }

  // Nuevo método para actualizar solo un producto del pedido
  async actualizarSeguimientoProducto(pedidoProductoId: string, data: any) {
    return prisma.pedidoProducto.update({
      where: { id: pedidoProductoId },
      data: {
        ...data,

        fechaInicioCorte: data.fechaInicioCorte ? new Date(data.fechaInicioCorte) : undefined,
        fechaConteo:      data.fechaConteo ? new Date(data.fechaConteo) : undefined,
        fechaAsignacion:  data.fechaAsignacion ? new Date(data.fechaAsignacion) : undefined,
        fechaDespacho:    data.fechaDespacho ? new Date(data.fechaDespacho) : undefined,

        cantidadTareas:   data.cantidadTareas ? Number(data.cantidadTareas) : undefined,
        cortes:           data.cortes ? Number(data.cortes) : undefined,
        cantidadRecibida: data.cantidadRecibida ? Number(data.cantidadRecibida) : undefined,
        cantidadDespacho: data.cantidadDespacho ? Number(data.cantidadDespacho) : undefined,
        cantidadFaltante: data.cantidadFaltante ? Number(data.cantidadFaltante) : undefined,
      }
    });
  }

  async cambiarEstado(id: string, estado: string) {
    const estadosValidos = Object.values(EstadoPedido);
    if (!estadosValidos.includes(estado as EstadoPedido)) {
      throw new AppError(`Estado inválido. Permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    return prisma.pedido.update({
      where: { id },
      data: { estado: estado as EstadoPedido }
    });
  }
}

export const pedidosService = new PedidosService();
