import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

interface CrearClienteDto {
  nombre: string;
  documento: string;
  direccion?: string;
  telefono?: string;
  transportadora?: string;
}

type ActualizarClienteDto = Partial<CrearClienteDto>;

export class ClientesService {

  async crear(dto: CrearClienteDto) {
    const existe = await prisma.cliente.findUnique({
      where: { documento: dto.documento.trim() },
    });
    if (existe) throw new AppError(409, 'Ya existe un cliente con ese documento');

    return prisma.cliente.create({ data: { ...dto, documento: dto.documento.trim() } });
  }

  async listar(params: PaginationParams): Promise<PaginatedResult<any>> {
    const where = params.search
      ? {
          OR: [
            { nombre:    { contains: params.search, mode: 'insensitive' as const } },
            { documento: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        skip:    getPrismaSkip(params),
        take:    params.limit,
        orderBy: { [params.sortBy ?? 'nombre']: params.sortOrder },
        include: { _count: { select: { pedidos: true } } },
      }),
      prisma.cliente.count({ where }),
    ]);

    return { items, total };
  }

  async obtenerPorId(id: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        pedidos: {
          orderBy: {
            createdAt: "desc"
          },
          take: 10,
          select: {
            id: true,
            codigo: true,
            estado: true,
            // cantidadPedido: true, // ❌ ELIMINA ESTA LÍNEA, el campo no existe
            createdAt: true,
            // Si necesitas mostrar cantidades, usualmente están en la relación productos:
            _count: {
              select: { productos: true }
            }
          }
        }
      }
    });
    return cliente;
  }

  async actualizar(id: string, dto: ActualizarClienteDto) {
    await this.obtenerPorId(id);

    if (dto.documento) {
      const existe = await prisma.cliente.findFirst({
        where: { documento: dto.documento.trim(), NOT: { id } },
      });
      if (existe) throw new AppError(409, 'Ese documento ya está en uso');
    }

    return prisma.cliente.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    const cliente = await this.obtenerPorId(id);
    const pedidos = await prisma.pedido.count({ where: { clienteId: id } });
    if (pedidos > 0) throw new AppError(409, 'No se puede eliminar: el cliente tiene pedidos');

    return prisma.cliente.update({ where: { id }, data: { activo: false } });
  }
}

export const clientesService = new ClientesService();
