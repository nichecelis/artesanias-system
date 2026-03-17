import { Prisma, EstadoPedido } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../types';

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
      where.createdAt = {
        ...(filtros.fechaDesde && { gte: new Date(filtros.fechaDesde) }),
        ...(filtros.fechaHasta && { lte: new Date(new Date(filtros.fechaHasta).setHours(23, 59, 59, 999)) }),
      };
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
            productoId: p.productoId,
            cantidadPedido: Number(p.cantidadPedido),
            cantidadPlancha: Number(p.cantidadPlancha || 0)
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
          estado:           p.estado || 'PENDIENTE',
          fechaInicioCorte: p.fechaInicioCorte ? new Date(p.fechaInicioCorte) : null,
          fechaConteo:      p.fechaConteo ? new Date(p.fechaConteo) : null,
          cantidadRecibida: p.cantidadRecibida,
          fechaDespacho:    p.fechaDespacho ? new Date(p.fechaDespacho) : null,
          // ... mapear los demás campos nuevos
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
        fechaDespacho:    data.fechaDespacho ? new Date(data.fechaDespacho) : undefined,
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
