import { EstadoProducto } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../types';

interface CrearProductoDto {
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  precioDecoracion: number;
}

type ActualizarProductoDto = Partial<CrearProductoDto & { estado: EstadoProducto }>;

export class ProductosService {

  async crear(dto: CrearProductoDto) {
    return prisma.producto.create({ data: dto });
  }

  async listar(params: { page?: number; limit?: number; estado?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.estado === 'ACTIVO') {
      where.estado = 'ACTIVO';
    } else if (params.estado === 'INACTIVO') {
      where.estado = 'INACTIVO';
    }

    const [items, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: limit,
        include: { productoCliente: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.producto.count({ where })
    ]);

    return { items, total };
  }

  async obtenerPorId(id: string) {
    const producto = await prisma.producto.findUnique({ 
      where: { id },
      include: { productoCliente: true } 
    });
    if (!producto) throw new AppError('Producto no encontrado', 404);
    return producto;
  }

  async actualizar(id: string, dto: ActualizarProductoDto) {
    await this.obtenerPorId(id);
    return prisma.producto.update({ where: { id }, data: dto });
  }

  async inactivar(id: string) {
    const producto = await this.obtenerPorId(id);
    
    const pedidosActivos = await prisma.pedidoProducto.count({
      where: {
        productoId: id,
        pedido: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
      },
    });
    if (pedidosActivos > 0) {
      throw new AppError('No se puede inactivar: el producto tiene pedidos activos', 409);
    }
    
    return prisma.producto.update({
      where: { id },
      data: { estado: EstadoProducto.INACTIVO },
    });
  }

  async activar(id: string) {
    const producto = await this.obtenerPorId(id);
    return prisma.producto.update({
      where: { id },
      data: { estado: EstadoProducto.ACTIVO },
    });
  }

  async eliminar(id: string) {
    return this.inactivar(id);
  }
}

export const productosService = new ProductosService();
