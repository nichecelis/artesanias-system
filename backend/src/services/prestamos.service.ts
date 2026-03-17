import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

type TipoBeneficiario = 'DECORADORA' | 'EMPLEADO';

interface CrearPrestamoDto {
  tipo:          TipoBeneficiario;
  beneficiarioId: string;
  monto:         number;
  fecha:         string;
  cuotas?:       number;
  observacion?:  string;
}

const INCLUDE = {
  decoradora: { select: { id: true, nombre: true, documento: true } },
  empleado:   { select: { id: true, nombre: true, documento: true } },
  abonos:     { orderBy: { fecha: 'desc' as const } },
  _count:     { select: { abonos: true } },
};

export class PrestamosService {

  async crear(dto: CrearPrestamoDto) {
    if (dto.tipo === 'DECORADORA') {
      const d = await prisma.decoradora.findUnique({ where: { id: dto.beneficiarioId } });
      if (!d || !d.activa) throw new AppError('Decoradora no encontrada', 404);
    } else {
      const e = await prisma.empleado.findUnique({ where: { id: dto.beneficiarioId } });
      if (!e || !e.activo) throw new AppError('Empleado no encontrado', 404);
    }

    return prisma.prestamo.create({
      data: {
        ...(dto.tipo === 'DECORADORA' ? { decoradoraId: dto.beneficiarioId } : { empleadoId: dto.beneficiarioId }),
        monto:       dto.monto,
        fecha:       new Date(dto.fecha + 'T00:00:00.000Z'),
        saldo:       dto.monto,
        cuotas:      dto.cuotas,
        observacion: dto.observacion,
      },
      include: INCLUDE,
    });
  }

  async listar(params: PaginationParams & {
    tipo?:          TipoBeneficiario;
    decoradoraId?:  string;
    empleadoId?:    string;
    soloConSaldo?:  boolean;
  }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (params.decoradoraId) where.decoradoraId = params.decoradoraId;
    if (params.empleadoId)   where.empleadoId   = params.empleadoId;
    if (params.tipo === 'DECORADORA') where.decoradoraId = { not: null };
    if (params.tipo === 'EMPLEADO')   where.empleadoId   = { not: null };
    if (params.soloConSaldo) where.saldo = { gt: 0 };
    if (params.search) {
      where.OR = [
        { decoradora: { nombre: { contains: params.search, mode: 'insensitive' } } },
        { empleado:   { nombre: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.prestamo.findMany({
        where,
        skip:    getPrismaSkip(params),
        take:    params.limit,
        orderBy: { fecha: 'desc' },
        include: INCLUDE,
      }),
      prisma.prestamo.count({ where }),
    ]);

    const itemsConAbonado = items.map((p: any) => ({
      ...p,
      totalAbonado: Number(p.monto) - Number(p.saldo),
    }));
    return { items: itemsConAbonado, total };
  }

  async obtenerPorId(id: string) {
    const p = await prisma.prestamo.findUnique({ where: { id }, include: INCLUDE });
    if (!p) throw new AppError('Préstamo no encontrado', 404);
    return p;
  }

  async abonar(id: string, monto: number, fecha: string) {
    const prestamo = await this.obtenerPorId(id);
    if (Number(prestamo.saldo) <= 0) throw new AppError('El préstamo ya está saldado', 400);
    if (monto > Number(prestamo.saldo)) throw new AppError(`El abono supera el saldo (${prestamo.saldo})`, 400);

    const nuevoSaldo = Number(prestamo.saldo) - monto;

    const [abono] = await prisma.$transaction([
      prisma.abono.create({
        data: { prestamoId: id, monto, fecha: new Date(fecha + 'T00:00:00.000Z') },
      }),
      prisma.prestamo.update({ where: { id }, data: { saldo: nuevoSaldo } }),
    ]);

    return { abono, saldo: nuevoSaldo };
  }

  async eliminarAbono(abonoId: string) {
    const abono = await prisma.abono.findUnique({ where: { id: abonoId }, include: { prestamo: true } });
    if (!abono) throw new AppError('Abono no encontrado', 404);

    const nuevoSaldo = Number(abono.prestamo.saldo) + Number(abono.monto);
    await prisma.$transaction([
      prisma.abono.delete({ where: { id: abonoId } }),
      prisma.prestamo.update({ where: { id: abono.prestamoId }, data: { saldo: nuevoSaldo } }),
    ]);
    return { saldo: nuevoSaldo };
  }

  async eliminar(id: string) {
    const prestamo = await this.obtenerPorId(id);
    if (Number(prestamo.saldo) < Number(prestamo.monto)) throw new AppError('No se puede eliminar: tiene abonos registrados', 400);
    return prisma.prestamo.delete({ where: { id } });
  }
}

export const prestamosService = new PrestamosService();
