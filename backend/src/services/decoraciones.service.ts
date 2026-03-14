import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

interface CrearDecoracionDto {
  pedidoId:      string;
  decoradoraId:  string;
  productoId:    string;
  fechaEgreso:   string;
  cantidadEgreso: number;
}

interface ActualizarDecoracionDto {
  fechaEgreso?:     string;
  cantidadEgreso?:  number;
  fechaIngreso?:    string;
  cantidadIngreso?: number;
  arreglos?:        number;
  perdidas?:        number;
  compras?:         number;
  abonosPrestamo?:  number;
  prestamoId?:      string | null;
  pagado?:          boolean;
}

const INCLUDE = {
  pedido:     { select: { id: true, codigo: true, cliente: { select: { nombre: true } } } },
  decoradora: { select: { id: true, nombre: true } },
  producto:   { select: { id: true, nombre: true, precioDecoracion: true } },
  prestamo:   { select: { id: true, monto: true, saldo: true } },
} as const;

function calcular(cantidadEgreso: number, precioDecoracion: number, compras = 0, abonosPrestamo = 0) {
  const total      = cantidadEgreso * precioDecoracion;
  const totalPagar = total - compras - abonosPrestamo;
  return { total, subtotal: totalPagar, totalPagar };
}

export class DecoracionesService {

  async crear(dto: CrearDecoracionDto) {
    const pedido = await prisma.pedido.findUnique({ where: { id: dto.pedidoId } });
    if (!pedido) throw new AppError(404, 'Pedido no encontrado');

    const decoradora = await prisma.decoradora.findUnique({ where: { id: dto.decoradoraId } });
    if (!decoradora || !decoradora.activa) throw new AppError(404, 'Decoradora no encontrada');

    const producto = await prisma.producto.findUnique({ where: { id: dto.productoId } });
    if (!producto) throw new AppError(404, 'Producto no encontrado');

    const precioDecoracion = Number(producto.precioDecoracion);
    const { total, subtotal, totalPagar } = calcular(dto.cantidadEgreso, precioDecoracion);

    return prisma.decoracion.create({
      data: {
        pedidoId:        dto.pedidoId,
        decoradoraId:    dto.decoradoraId,
        productoId:      dto.productoId,
        fechaEgreso:     new Date(dto.fechaEgreso + 'T00:00:00.000Z'),
        cantidadEgreso:  dto.cantidadEgreso,
        precioDecoracion,
        total, subtotal, totalPagar,
        compras: 0, arreglos: 0, perdidas: 0, abonosPrestamo: 0,
      },
      include: INCLUDE,
    });
  }

  async actualizar(id: string, dto: ActualizarDecoracionDto) {
    const dec = await prisma.decoracion.findUnique({ where: { id } });
    if (!dec) throw new AppError(404, 'Decoración no encontrada');

    // Validar préstamo si se especifica
    if (dto.prestamoId) {
      const prestamo = await prisma.prestamo.findUnique({ where: { id: dto.prestamoId } });
      if (!prestamo) throw new AppError(404, 'Préstamo no encontrado');
      if (Number(prestamo.saldo) <= 0) throw new AppError(400, 'El préstamo ya está saldado');
    }

    const cantidadEgreso  = dto.cantidadEgreso  ?? dec.cantidadEgreso;
    const compras         = dto.compras         ?? Number(dec.compras);
    const abonoAnterior   = Number(dec.abonosPrestamo);
    const abonoNuevo      = dto.abonosPrestamo  ?? abonoAnterior;
    const precioDecoracion = Number(dec.precioDecoracion);
    const { total, subtotal, totalPagar } = calcular(cantidadEgreso, precioDecoracion, compras, abonoNuevo);

    const data: any = {
      ...dto,
      cantidadEgreso, compras, abonosPrestamo: abonoNuevo,
      total, subtotal, totalPagar,
    };

    if (dto.fechaEgreso) data.fechaEgreso = new Date(dto.fechaEgreso + 'T00:00:00.000Z');
    if (dto.fechaIngreso) data.fechaIngreso = new Date(dto.fechaIngreso + 'T00:00:00.000Z');
    else if (dto.fechaIngreso === '') data.fechaIngreso = null;

    // Si cambió el abono de préstamo, actualizar el saldo del préstamo
    const prestamoIdActual  = dec.prestamoId;
    const prestamoIdNuevo   = dto.prestamoId !== undefined ? dto.prestamoId : prestamoIdActual;
    const diferencia        = abonoNuevo - abonoAnterior;

    return prisma.$transaction(async (tx) => {
      // Revertir abono anterior si cambió de préstamo
      if (prestamoIdActual && (prestamoIdActual !== prestamoIdNuevo || diferencia !== 0)) {
        await tx.prestamo.update({
          where: { id: prestamoIdActual },
          data:  { saldo: { increment: abonoAnterior } },
        });
      }

      // Aplicar nuevo abono
      if (prestamoIdNuevo && abonoNuevo > 0) {
        const prestamo = await tx.prestamo.findUnique({ where: { id: prestamoIdNuevo } });
        if (prestamo) {
          const saldoBase = prestamoIdActual === prestamoIdNuevo ? Number(prestamo.saldo) + abonoAnterior : Number(prestamo.saldo);
          if (abonoNuevo > saldoBase) throw new AppError(400, `El abono ($${abonoNuevo}) supera el saldo del préstamo ($${saldoBase})`);
          await tx.prestamo.update({
            where: { id: prestamoIdNuevo },
            data:  { saldo: { decrement: abonoNuevo } },
          });
        }
      }

      return tx.decoracion.update({ where: { id }, data, include: INCLUDE });
    });
  }

  async eliminar(id: string) {
    const dec = await prisma.decoracion.findUnique({ where: { id } });
    if (!dec) throw new AppError(404, 'Decoración no encontrada');
    if (dec.pagado) throw new AppError(400, 'No se puede eliminar una decoración ya pagada');

    return prisma.$transaction(async (tx) => {
      // Revertir abono si había
      if (dec.prestamoId && Number(dec.abonosPrestamo) > 0) {
        await tx.prestamo.update({
          where: { id: dec.prestamoId },
          data:  { saldo: { increment: Number(dec.abonosPrestamo) } },
        });
      }
      return tx.decoracion.delete({ where: { id } });
    });
  }

  async listar(params: PaginationParams & {
    decoradoraId?: string;
    pedidoId?:     string;
    pagado?:       boolean;
  }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (params.decoradoraId) where.decoradoraId = params.decoradoraId;
    if (params.pedidoId)     where.pedidoId     = params.pedidoId;
    if (params.pagado !== undefined) where.pagado = params.pagado;
    if (params.search) {
      where.OR = [
        { pedido:     { codigo:  { contains: params.search, mode: 'insensitive' } } },
        { decoradora: { nombre:  { contains: params.search, mode: 'insensitive' } } },
        { producto:   { nombre:  { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.decoracion.findMany({
        where, skip: getPrismaSkip(params), take: params.limit,
        orderBy: { fechaEgreso: 'desc' },
        include: INCLUDE,
      }),
      prisma.decoracion.count({ where }),
    ]);

    return { items, total };
  }

  async obtenerPorId(id: string) {
    const dec = await prisma.decoracion.findUnique({ where: { id }, include: INCLUDE });
    if (!dec) throw new AppError(404, 'Decoración no encontrada');
    return dec;
  }

  async marcarPagado(id: string) {
    const dec = await prisma.decoracion.findUnique({ where: { id } });
    if (!dec) throw new AppError(404, 'Decoración no encontrada');
    if (!dec.cantidadIngreso) throw new AppError(400, 'Registra el ingreso antes de pagar');
    return prisma.decoracion.update({ where: { id }, data: { pagado: true } });
  }
}

export const decoracionesService = new DecoracionesService();
