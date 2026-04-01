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
    if (existe) throw new AppError('Ya existe un cliente con ese documento', 409);

    return prisma.cliente.create({ data: { ...dto, documento: dto.documento.trim() } });
  }

  async listar(params: PaginationParams & { activo?: boolean | string }): Promise<PaginatedResult<any>> {
    const where: any = {};

    if (params.activo === true || params.activo === 'true') {
      where.activo = true;
    } else if (params.activo === false || params.activo === 'false') {
      where.activo = false;
    }

    if (params.search) {
      where.OR = [
        { nombre:    { contains: params.search, mode: 'insensitive' as const } },
        { documento: { contains: params.search, mode: 'insensitive' as const } },
      ];
    }

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
    if (!cliente) throw new AppError('Cliente no encontrado', 404);
    return cliente;
  }

  async obtenerPorDocumento(documento: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { documento: documento.trim() },
      include: {
        pedidos: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            codigo: true,
            estado: true,
            createdAt: true,
            _count: { select: { productos: true } }
          }
        }
      }
    });
    if (!cliente) throw new AppError('Cliente no encontrado', 404);
    return cliente;
  }

  async actualizar(id: string, dto: ActualizarClienteDto) {
    await this.obtenerPorId(id);

    if (dto.documento) {
      const existe = await prisma.cliente.findFirst({
        where: { documento: dto.documento.trim(), NOT: { id } },
      });
      if (existe) throw new AppError('Ese documento ya está en uso', 409);
    }

    return prisma.cliente.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    const cliente = await this.obtenerPorId(id);
    const pedidos = await prisma.pedido.count({ where: { clienteId: id } });
    if (pedidos > 0) throw new AppError('No se puede eliminar: el cliente tiene pedidos', 409);

    return prisma.cliente.update({ where: { id }, data: { activo: false } });
  }

  async actualizarPorDocumento(documento: string, dto: { nombre?: string; direccion?: string; telefono?: string; transportadora?: string; documento?: string }) {
    const cliente = await prisma.cliente.findUnique({ where: { documento: documento.trim() } });
    if (!cliente) throw new AppError('Cliente no encontrado', 404);

    if (dto.documento) {
      const existe = await prisma.cliente.findFirst({
        where: { documento: dto.documento.trim(), NOT: { id: cliente.id } },
      });
      if (existe) throw new AppError('Ese documento ya está en uso', 409);
    }

    return prisma.cliente.update({ where: { id: cliente.id }, data: dto });
  }

  async eliminarPorDocumento(documento: string) {
    const cliente = await prisma.cliente.findUnique({ where: { documento: documento.trim() } });
    if (!cliente) throw new AppError('Cliente no encontrado', 404);

    const pedidosActivos = await prisma.pedido.count({
      where: {
        clienteId: cliente.id,
        estado: { notIn: ['DESPACHADO', 'CANCELADO'] },
      },
    });
    if (pedidosActivos > 0) {
      throw new AppError('No se puede inactivar: el cliente tiene pedidos activos', 409);
    }

    return prisma.cliente.update({ where: { id: cliente.id }, data: { activo: false } });
  }
}

export const clientesService = new ClientesService();
