import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

// ─── Empleados ────────────────────────────────────────────────

interface CrearEmpleadoDto {
  nombre:    string;
  documento: string;
  salario:   number;
}

export class EmpleadosService {

  async crear(dto: CrearEmpleadoDto) {
    const existe = await prisma.empleado.findUnique({ where: { documento: dto.documento.trim() } });
    if (existe) throw new AppError('Ya existe un empleado con ese documento', 409);
    return prisma.empleado.create({ data: { ...dto, documento: dto.documento.trim() } });
  }

  async listar(params: PaginationParams & { activo?: boolean | string }): Promise<PaginatedResult<any>> {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { nombre:    { contains: params.search, mode: 'insensitive' as const } },
        { documento: { contains: params.search, mode: 'insensitive' as const } },
      ];
    }

    if (params.activo === true || params.activo === 'true') {
      where.activo = true;
    } else if (params.activo === false || params.activo === 'false') {
      where.activo = false;
    }

    const [items, total] = await prisma.$transaction([
      prisma.empleado.findMany({ where, skip: getPrismaSkip(params), take: params.limit, orderBy: { nombre: 'asc' } }),
      prisma.empleado.count({ where }),
    ]);
    return { items, total };
  }

  async obtenerPorId(id: string) {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: { nominas: { orderBy: { fecha: 'desc' }, take: 12 } },
    });
    if (!empleado) throw new AppError('Empleado no encontrado', 404);
    return empleado;
  }

  async actualizar(id: string, dto: Partial<CrearEmpleadoDto>) {
    await this.obtenerPorId(id);
    return prisma.empleado.update({ where: { id }, data: dto });
  }

  async inactivar(id: string) {
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado) throw new AppError('Empleado no encontrado', 404);
    if (!empleado.activo) throw new AppError('El empleado ya está inactivo', 400);
    const nominasActivas = await prisma.nomina.count({ where: { empleadoId: id } });
    if (nominasActivas > 0) throw new AppError('No se puede inactivar: el empleado tiene nóminas registradas', 409);
    return prisma.empleado.update({ where: { id }, data: { activo: false } });
  }

  async activar(id: string) {
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado) throw new AppError('Empleado no encontrado', 404);
    if (empleado.activo) throw new AppError('El empleado ya está activo', 400);
    return prisma.empleado.update({ where: { id }, data: { activo: true } });
  }
}

// ─── Nómina ───────────────────────────────────────────────────

interface CrearNominaDto {
  empleadoId:     string;
  fecha:          string;
  diasTrabajados: number;
  horasExtras?:   number;
  prestamoId?:    string | null;
  abonosPrestamo?: number;
  observaciones?: string;
}

interface ActualizarNominaDto {
  fecha?:          string;
  diasTrabajados?: number;
  horasExtras?:    number;
  prestamoId?:     string | null;
  abonosPrestamo?: number;
  observaciones?:  string;
}

const INCLUDE_NOMINA = {
  empleado: { select: { id: true, nombre: true, salario: true } },
  prestamo: { select: { id: true, monto: true, saldo: true } },
} as const;

function calcularNomina(salario: number, diasTrabajados: number, horasExtras: number, abonosPrestamo: number) {
  const salarioDia     = salario / 30;
  const subtotalDias   = salarioDia * diasTrabajados;
  const valorHoraExtra = salario / 30 / 9;                    // sueldo ÷ 30 ÷ 9
  const subtotalHoras  = valorHoraExtra * horasExtras;
  const totalPagar     = subtotalDias + subtotalHoras - abonosPrestamo;

  return {
    salarioDia:     Math.round(salarioDia * 100) / 100,
    subtotalDias:   Math.round(subtotalDias * 100) / 100,
    valorHoraExtra: Math.round(valorHoraExtra * 100) / 100,
    subtotalHoras:  Math.round(subtotalHoras * 100) / 100,
    totalPagar:     Math.round(totalPagar * 100) / 100,
  };
}

export class NominaService {

  async registrar(dto: CrearNominaDto) {
    const empleado = await prisma.empleado.findUnique({ where: { id: dto.empleadoId } });
    if (!empleado || !empleado.activo) throw new AppError('Empleado no encontrado', 404);

    const horasExtras    = dto.horasExtras    ?? 0;
    const abonosPrestamo = dto.abonosPrestamo ?? 0;

    // Validar préstamo si se especifica
    if (dto.prestamoId) {
      const prestamo = await prisma.prestamo.findUnique({ where: { id: dto.prestamoId } });
      if (!prestamo) throw new AppError('Préstamo no encontrado', 404);
      if (abonosPrestamo > Number(prestamo.saldo)) throw new AppError(`El abono supera el saldo del préstamo ($${prestamo.saldo})`, 400);
    }

    const calc = calcularNomina(Number(empleado.salario), dto.diasTrabajados, horasExtras, abonosPrestamo);

    return prisma.$transaction(async (tx) => {
      // Descontar abono del préstamo si aplica
      if (dto.prestamoId && abonosPrestamo > 0) {
        await tx.prestamo.update({
          where: { id: dto.prestamoId },
          data:  { saldo: { decrement: abonosPrestamo }, cuotasPagadas: { increment: 1 } },
        });
      }

      return tx.nomina.create({
        data: {
          empleadoId:     dto.empleadoId,
          prestamoId:     dto.prestamoId ?? null,
          fecha:          (() => { const d = new Date(dto.fecha); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); })(),
          diasTrabajados: dto.diasTrabajados,
          horasExtras,
          abonosPrestamo,
          observaciones:  dto.observaciones,
          ...calc,
        },
        include: INCLUDE_NOMINA,
      });
    });
  }

  async registrarBatch(fecha: string, items: Array<{
    empleadoId: string;
    diasTrabajados: number;
    horasExtras?: number;
    abonosPrestamo?: number;
    observaciones?: string;
    prestamoId?: string | null;
  }>) {
    const results = [];

    for (const item of items) {
      const empleado = await prisma.empleado.findUnique({ where: { id: item.empleadoId } });
      if (!empleado || !empleado.activo) {
        throw new AppError(`Empleado ${item.empleadoId} no encontrado o inactivo`, 404);
      }

      const horasExtras    = item.horasExtras    ?? 0;
      const abonosPrestamo = item.abonosPrestamo ?? 0;

      if (item.prestamoId) {
        const prestamo = await prisma.prestamo.findUnique({ where: { id: item.prestamoId } });
        if (!prestamo) throw new AppError('Préstamo no encontrado', 404);
        if (abonosPrestamo > Number(prestamo.saldo)) throw new AppError(`El abono supera el saldo del préstamo ($${prestamo.saldo})`, 400);
      }

      const calc = calcularNomina(Number(empleado.salario), item.diasTrabajados, horasExtras, abonosPrestamo);

      const nomina = await prisma.$transaction(async (tx) => {
        if (item.prestamoId && abonosPrestamo > 0) {
          await tx.prestamo.update({
            where: { id: item.prestamoId },
            data:  { saldo: { decrement: abonosPrestamo }, cuotasPagadas: { increment: 1 } },
          });
        }

        return tx.nomina.create({
          data: {
            empleadoId:     item.empleadoId,
            prestamoId:     item.prestamoId ?? null,
            fecha:          (() => { const d = new Date(fecha); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); })(),
            diasTrabajados: item.diasTrabajados,
            horasExtras,
            abonosPrestamo,
            observaciones:  item.observaciones,
            ...calc,
          },
          include: INCLUDE_NOMINA,
        });
      });

      results.push(nomina);
    }

    return results;
  }

  async actualizar(id: string, dto: ActualizarNominaDto) {
    const nomina = await prisma.nomina.findUnique({ where: { id }, include: { empleado: true } });
    if (!nomina) throw new AppError('Registro de nómina no encontrado', 404);

    const horasExtras    = dto.horasExtras    ?? Number(nomina.horasExtras);
    const abonoNuevo     = dto.abonosPrestamo ?? Number(nomina.abonosPrestamo);
    const abonoAnterior  = Number(nomina.abonosPrestamo);
    const prestamoNuevo  = dto.prestamoId !== undefined ? dto.prestamoId : nomina.prestamoId;

    const calc = calcularNomina(
      Number(nomina.empleado.salario),
      dto.diasTrabajados ?? nomina.diasTrabajados,
      horasExtras,
      abonoNuevo
    );

    return prisma.$transaction(async (tx) => {
      // Revertir abono anterior
      if (nomina.prestamoId && abonoAnterior > 0) {
        await tx.prestamo.update({ where: { id: nomina.prestamoId }, data: { saldo: { increment: abonoAnterior } } });
      }
      // Aplicar nuevo abono
      if (prestamoNuevo && abonoNuevo > 0) {
        const p = await tx.prestamo.findUnique({ where: { id: prestamoNuevo } });
        const saldoBase = nomina.prestamoId === prestamoNuevo ? Number(p!.saldo) + abonoAnterior : Number(p!.saldo);
        if (abonoNuevo > saldoBase) throw new AppError(`El abono supera el saldo ($${saldoBase})`, 400);
        await tx.prestamo.update({ where: { id: prestamoNuevo }, data: { saldo: { decrement: abonoNuevo } } });
      }

      return tx.nomina.update({
        where: { id },
        data: {
          ...(dto.fecha ? { fecha: (() => { const d = new Date(dto.fecha); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); })() } : {}),
          diasTrabajados: dto.diasTrabajados ?? nomina.diasTrabajados,
          horasExtras,
          abonosPrestamo: abonoNuevo,
          prestamoId:     prestamoNuevo,
          observaciones:  dto.observaciones,
          ...calc,
        },
        include: INCLUDE_NOMINA,
      });
    });
  }

  async eliminar(id: string) {
    const nomina = await prisma.nomina.findUnique({ where: { id } });
    if (!nomina) throw new AppError('Registro de nómina no encontrado', 404);

    return prisma.$transaction(async (tx) => {
      // Revertir saldo del préstamo (sin modificar cuotasPagadas)
      if (nomina.prestamoId && Number(nomina.abonosPrestamo) > 0) {
        await tx.prestamo.update({ 
          where: { id: nomina.prestamoId }, 
          data: { saldo: { increment: Number(nomina.abonosPrestamo) }, activo: true } 
        });
      }
      return tx.nomina.delete({ where: { id } });
    });
  }

  async listar(params: PaginationParams & { empleadoId?: string; mes?: string }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (params.empleadoId) where.empleadoId = params.empleadoId;
    if (params.mes) {
      const [year, month] = params.mes.split('-').map(Number);
      where.fecha = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
    }
    if (params.search) {
      where.empleado = { nombre: { contains: params.search, mode: 'insensitive' } };
    }

    const [items, total] = await prisma.$transaction([
      prisma.nomina.findMany({
        where, skip: getPrismaSkip(params), take: params.limit,
        orderBy: { fecha: 'desc' },
        include: INCLUDE_NOMINA,
      }),
      prisma.nomina.count({ where }),
    ]);
    return { items, total };
  }

  async totalMes(mes: string) {
    const [year, month] = mes.split('-').map(Number);
    const resultado = await prisma.nomina.aggregate({
      where: { fecha: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
      _sum:   { totalPagar: true },
      _count: { id: true },
    });
    return { totalNomina: resultado._sum.totalPagar ?? 0, registros: resultado._count.id };
  }
}

export const empleadosService = new EmpleadosService();
export const nominaService    = new NominaService();
