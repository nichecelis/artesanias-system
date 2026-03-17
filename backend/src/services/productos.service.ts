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

  async listar(params: { page?: number; limit?: number }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.producto.findMany({
        where: { estado: 'ACTIVO' }, // 👈 FILTRO CLAVE
        skip,
        take: limit,
        include: { productoCliente: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.producto.count({
        where: { estado: 'ACTIVO' } // 👈 IMPORTANTE también aquí
      })
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

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    const decoracionesActivas = await prisma.decoracion.count({
      where: { productoId: id, fechaIngreso: null },
    });
    if (decoracionesActivas > 0) {
      throw new AppError('No se puede eliminar: el producto tiene decoraciones activas', 409);
    }
    return prisma.producto.update({
      where: { id },
      data: { estado: EstadoProducto.INACTIVO },
    });
  }
}

export const productosService = new ProductosService();
