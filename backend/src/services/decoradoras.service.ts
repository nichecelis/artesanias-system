import { TipoCuenta } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

interface CrearDecoradoraDto {
  nombre:     string;
  documento:  string;
  telefono?:  string;
  grupoId?:   string | null;
  banco?:     string;
  numCuenta?: string;
  tipoCuenta?: TipoCuenta;
}

type ActualizarDecoradoraDto = Partial<CrearDecoradoraDto & { activa: boolean }>;

const INCLUDE_BASE = {
  grupo: { select: { id: true, nombre: true, tipo: true } },
  _count: { select: { decoraciones: true, prestamos: true } },
  prestamos: { where: { saldo: { gt: 0 } }, select: { saldo: true } },
} as const;

export class DecoradorasService {

  async crear(dto: CrearDecoradoraDto) {
    const existe = await prisma.decoradora.findUnique({ where: { documento: dto.documento.trim() } });
    if (existe) throw new AppError('Ya existe una decoradora con ese documento', 409);
    const { grupoId, ...rest } = dto as any;
    const data: any = { ...rest, documento: dto.documento.trim() };
    if (grupoId) data.grupo = { connect: { id: grupoId } };
    return prisma.decoradora.create({ data });
  }

  async listar(params: PaginationParams & { activa?: boolean | string }): Promise<PaginatedResult<any>> {
    const where: any = {};

    if (params.activa === true || params.activa === 'true') {
      where.activa = true;
    } else if (params.activa === false || params.activa === 'false') {
      where.activa = false;
    }

    if (params.search) {
      where.OR = [
        { nombre:    { contains: params.search, mode: 'insensitive' } },
        { documento: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.decoradora.findMany({
        where,
        skip:    getPrismaSkip(params),
        take:    params.limit,
        orderBy: { [params.sortBy ?? 'nombre']: params.sortOrder },
        include: INCLUDE_BASE,
      }),
      prisma.decoradora.count({ where }),
    ]);

    const itemsConDeuda = items.map((d: any) => ({
      ...d,
      deudaTotal: d.prestamos.reduce((acc: number, p: any) => acc + Number(p.saldo), 0),
    }));

    return { items: itemsConDeuda, total };
  }

  async obtenerPorId(id: string) {
    const decoradora = await prisma.decoradora.findUnique({
      where: { id },
      include: {
        grupo: { select: { id: true, nombre: true, tipo: true } },
        decoraciones: {
          orderBy: { fechaEgreso: 'desc' },
          take: 20,
          include: {
            pedido:   { select: { codigo: true } },
            producto: { select: { nombre: true } },
          },
        },
        prestamos: {
          orderBy: { fecha: 'desc' },
          include: { abonos: { orderBy: { fecha: 'desc' } } },
        },
      },
    });
    if (!decoradora) throw new AppError('Decoradora no encontrada', 404);
    return decoradora;
  }

  async actualizar(id: string, dto: ActualizarDecoradoraDto) {
    await this.obtenerPorId(id);
    const { grupoId, ...rest } = dto as any;
    const data: any = { ...rest };
    if (grupoId !== undefined) {
      data.grupo = grupoId ? { connect: { id: grupoId } } : { disconnect: true };
    }
    return prisma.decoradora.update({ where: { id }, data });
  }

  async inactivar(id: string) {
    const decoradora = await this.obtenerPorId(id);
    
    const decoracionesActivas = await prisma.decoracion.count({
      where: {
        decoradoraId: id,
        fechaIngreso: null,
      },
    });
    if (decoracionesActivas > 0) {
      throw new AppError('No se puede inactivar: la decoradora tiene decoraciones activas (pendientes)', 409);
    }
    
    const decoracionesSinPagar = await prisma.decoracion.count({
      where: {
        decoradoraId: id,
        pagado: false,
      },
    });
    if (decoracionesSinPagar > 0) {
      throw new AppError('No se puede inactivar: la decoradora tiene decoraciones por pagar', 409);
    }
    
    return prisma.decoradora.update({
      where: { id },
      data: { activa: false },
    });
  }

  async activar(id: string) {
    await this.obtenerPorId(id);
    return prisma.decoradora.update({
      where: { id },
      data: { activa: true },
    });
  }

  async resumenPagos(id: string) {
    await this.obtenerPorId(id);

    const [pendientes, totalPagado, prestamosActivos] = await prisma.$transaction([
      prisma.decoracion.findMany({
        where: { decoradoraId: id, pagado: false, fechaIngreso: { not: null } },
        select: {
          id: true, totalPagar: true, fechaIngreso: true,
          pedido:   { select: { codigo: true } },
          producto: { select: { nombre: true } },
        },
      }),
      prisma.decoracion.aggregate({
        where: { decoradoraId: id, pagado: true },
        _sum: { totalPagar: true },
      }),
      prisma.prestamo.findMany({
        where: { decoradoraId: id, saldo: { gt: 0 } },
        select: { saldo: true },
      }),
    ]);

    const totalPendiente = pendientes.reduce((acc, d) => acc + Number(d.totalPagar), 0);
    const deudaTotal     = prestamosActivos.reduce((acc, p) => acc + Number(p.saldo), 0);

    return {
      decoraciones:   pendientes,
      totalPendiente,
      totalPagado:    totalPagado._sum.totalPagar ?? 0,
      deudaTotal,
    };
  }
}

export const decoradorasService = new DecoradorasService();
