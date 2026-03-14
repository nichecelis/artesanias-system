import { EstadoProducto } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

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

  async listar(params: PaginationParams): Promise<PaginatedResult<any>> {
    const where = {
      ...(params.search && {
        nombre: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.producto.findMany({
        where,
        skip:    getPrismaSkip(params),
        take:    params.limit,
        orderBy: { [params.sortBy ?? 'nombre']: params.sortOrder },
      }),
      prisma.producto.count({ where }),
    ]);

    return { items, total };
  }

  async obtenerPorId(id: string) {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) throw new AppError(404, 'Producto no encontrado');
    return producto;
  }

  async actualizar(id: string, dto: ActualizarProductoDto) {
    await this.obtenerPorId(id);
    return prisma.producto.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    // Verificar que no tenga decoraciones activas
    const decoracionesActivas = await prisma.decoracion.count({
      where: { productoId: id, fechaIngreso: null },
    });
    if (decoracionesActivas > 0) {
      throw new AppError(409, 'No se puede eliminar: el producto tiene decoraciones activas');
    }
    return prisma.producto.update({
      where: { id },
      data: { estado: EstadoProducto.INACTIVO },
    });
  }
}

export const productosService = new ProductosService();
