import { Prisma, EstadoPedido } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../types';

export class PedidosService {
    async listar(filtros: any) {
    const page = Number(filtros.page) || 1;
    const limit = Number(filtros.limit) || 20;
    
    const where: Prisma.PedidoWhereInput = {};

    // Filtro por texto (Código o Cliente)
    if (filtros.search) {
      where.OR = [
        { codigo: { contains: filtros.search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: filtros.search, mode: 'insensitive' } } }
      ];
    }

    // Filtro por Estado
    if (filtros.estado) {
      where.estado = filtros.estado as EstadoPedido;
    }

    // Filtro por Rango de Fechas
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

  async obtenerPorId(id: string) {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { cliente: true, productos: { include: { producto: true } } }
    });
    if (!pedido) throw new AppError("Pedido no encontrado", 404);
    return pedido;
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
    
    if (productos) {
      if (!Array.isArray(productos) || productos.length === 0) {
        throw new AppError("El pedido debe incluir al menos un producto", 400);
      }
      
      await prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } });
      (resto as any).productos = {
        create: productos.map((p: any) => ({
          productoId: p.productoId,
          cantidadPedido: Number(p.cantidadPedido),
          cantidadPlancha: Number(p.cantidadPlancha || 0)
        }))
      };
    }

    return prisma.pedido.update({
      where: { id },
      data: resto,
      include: { cliente: true, productos: { include: { producto: true } } }
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
