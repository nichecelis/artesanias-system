import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

interface CrearDecoracionDto {
  pedidoId:      string;
  decoradoraId:  string;
  productos: {
    productoId:    string;
    fechaEgreso:   string;
    cantidadEgreso: number;
  }[];
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

interface ActualizarDecoracionBatchDto {
  id:             string;
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
    if (!pedido) throw new AppError('Pedido no encontrado', 404);

    const decoradora = await prisma.decoradora.findUnique({ where: { id: dto.decoradoraId } });
    if (!decoradora || !decoradora.activa) throw new AppError('Decoradora no encontrada', 404);

    return prisma.$transaction(async (tx) => {
      const decoracionesCreadas = [];

      for (const prod of dto.productos) {
        const producto = await tx.producto.findUnique({ where: { id: prod.productoId } });
        if (!producto) throw new AppError(`Producto ${prod.productoId} no encontrado`, 404);

        const precioDecoracion = Number(producto.precioDecoracion);
        const { total, subtotal, totalPagar } = calcular(prod.cantidadEgreso, precioDecoracion);

        const pedidoProducto = await tx.pedidoProducto.findFirst({
          where: { pedidoId: dto.pedidoId, productoId: prod.productoId }
        });
        if (!pedidoProducto) throw new AppError(`Producto del pedido no encontrado: ${prod.productoId}`, 404);

        const [y, m, day] = prod.fechaEgreso.split('-');
        const fechaAsignacion = new Date(Number(y), Number(m) - 1, Number(day), 12, 0, 0);

        const cantidadActual = Number(pedidoProducto.cantidadRecibida) || 0;
        const nuevaCantidad = cantidadActual + prod.cantidadEgreso;

        await tx.pedidoProducto.update({
          where: { id: pedidoProducto.id },
          data: {
            fechaAsignacion,
            cantidadRecibida: nuevaCantidad,
            estado: 'EN_DECORACION',
          },
        });

        const decoracion = await tx.decoracion.create({
          data: {
            pedidoId:        dto.pedidoId,
            decoradoraId:    dto.decoradoraId,
            productoId:      prod.productoId,
            fechaEgreso:     new Date(prod.fechaEgreso + 'T00:00:00.000Z'),
            cantidadEgreso:  prod.cantidadEgreso,
            precioDecoracion,
            total, subtotal, totalPagar,
            compras: 0, arreglos: 0, perdidas: 0, abonosPrestamo: 0,
          },
          include: INCLUDE,
        });

        decoracionesCreadas.push(decoracion);
      }

      return decoracionesCreadas;
    });
  }

  async actualizar(id: string, dto: ActualizarDecoracionDto) {
    const dec = await prisma.decoracion.findUnique({ where: { id } });
    if (!dec) throw new AppError('Decoración no encontrada', 404);

    // Validar préstamo si se especifica
    if (dto.prestamoId) {
      const prestamo = await prisma.prestamo.findUnique({ where: { id: dto.prestamoId } });
      if (!prestamo) throw new AppError('Préstamo no encontrado', 404);
      if (Number(prestamo.saldo) <= 0) throw new AppError('El préstamo ya está saldado', 400);
    }

    const cantidadEgreso  = dto.cantidadEgreso  ?? dec.cantidadEgreso;
    const cantidadIngreso = dto.cantidadIngreso ?? dec.cantidadIngreso;
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

    // No marcar automáticamente como pagado - se hace manualmente

    // Si cambió el abono de préstamo, actualizar el saldo del préstamo
    const prestamoIdActual  = dec.prestamoId;
    const prestamoIdNuevo   = dto.prestamoId !== undefined ? dto.prestamoId : prestamoIdActual;
    const diferencia        = abonoNuevo - abonoAnterior;

    return prisma.$transaction(async (tx) => {
      // Revertir saldo del préstamo anterior (sin cambiar cuotasPagadas)
      if (prestamoIdActual && (prestamoIdActual !== prestamoIdNuevo || diferencia !== 0)) {
        await tx.prestamo.update({
          where: { id: prestamoIdActual },
          data:  { saldo: { increment: abonoAnterior } },
        });
      }

      // Aplicar nuevo abono al préstamo (solo si es la primera vez que se abona desde esta decoración)
      if (prestamoIdNuevo && abonoNuevo > 0 && abonoAnterior === 0) {
        const prestamo = await tx.prestamo.findUnique({ where: { id: prestamoIdNuevo } });
        if (prestamo) {
          const saldoBase = Number(prestamo.saldo);
          if (abonoNuevo > saldoBase) throw new AppError(`El abono ($${abonoNuevo}) supera el saldo del préstamo ($${saldoBase})`, 400);
          const nuevoSaldo = saldoBase - abonoNuevo;
          await tx.prestamo.update({
            where: { id: prestamoIdNuevo },
            data:  { saldo: nuevoSaldo, cuotasPagadas: { increment: 1 }, activo: nuevoSaldo > 0 },
          });
        }
      } else if (prestamoIdNuevo && abonoNuevo > 0 && abonoAnterior > 0) {
        // Si ya tenía abono, solo actualiza el saldo
        const prestamo = await tx.prestamo.findUnique({ where: { id: prestamoIdNuevo } });
        if (prestamo) {
          const saldoBase = Number(prestamo.saldo) + abonoAnterior;
          if (abonoNuevo > saldoBase) throw new AppError(`El abono ($${abonoNuevo}) supera el saldo del préstamo ($${saldoBase})`, 400);
          const nuevoSaldo = saldoBase - abonoNuevo;
          await tx.prestamo.update({
            where: { id: prestamoIdNuevo },
            data:  { saldo: nuevoSaldo, activo: nuevoSaldo > 0 },
          });
        }
      }

      return tx.decoracion.update({ where: { id }, data, include: INCLUDE });
    });
  }

  async actualizarVarias(items: ActualizarDecoracionBatchDto[]) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const item of items) {
        const { id, ...dto } = item;
        const dec = await tx.decoracion.findUnique({ where: { id } });
        if (!dec) throw new AppError(`Decoración ${id} no encontrada`, 404);

        const cantidadEgreso    = dec.cantidadEgreso;
        const cantidadIngreso   = dto.cantidadIngreso ?? dec.cantidadIngreso;
        const compras           = dto.compras         ?? Number(dec.compras);
        const abonoAnterior     = Number(dec.abonosPrestamo);
        const abonoNuevo        = dto.abonosPrestamo  ?? abonoAnterior;
        const precioDecoracion  = Number(dec.precioDecoracion);
        const { total, subtotal, totalPagar } = calcular(cantidadEgreso, precioDecoracion, compras, abonoNuevo);

        const data: any = {
          cantidadIngreso, compras, abonosPrestamo: abonoNuevo,
          total, subtotal, totalPagar,
        };

        if (dto.fechaIngreso) data.fechaIngreso = new Date(dto.fechaIngreso + 'T00:00:00.000Z');
        else if (dto.fechaIngreso === '') data.fechaIngreso = null;

        const prestamoIdActual = dec.prestamoId;
        const prestamoIdNuevo = dto.prestamoId !== undefined ? dto.prestamoId : prestamoIdActual;
        const diferencia = abonoNuevo - abonoAnterior;

        if (prestamoIdActual && (prestamoIdActual !== prestamoIdNuevo || diferencia !== 0)) {
          await tx.prestamo.update({
            where: { id: prestamoIdActual },
            data:  { saldo: { increment: abonoAnterior } },
          });
        }

        if (prestamoIdNuevo && abonoNuevo > 0 && abonoAnterior === 0) {
          const prestamo = await tx.prestamo.findUnique({ where: { id: prestamoIdNuevo } });
          if (prestamo) {
            const saldoBase = Number(prestamo.saldo);
            if (abonoNuevo > saldoBase) throw new AppError(`El abono ($${abonoNuevo}) supera el saldo del préstamo ($${saldoBase})`, 400);
            const nuevoSaldo = saldoBase - abonoNuevo;
            await tx.prestamo.update({
              where: { id: prestamoIdNuevo },
              data:  { saldo: nuevoSaldo, cuotasPagadas: { increment: 1 }, activo: nuevoSaldo > 0 },
            });
          }
        } else if (prestamoIdNuevo && abonoNuevo > 0 && abonoAnterior > 0) {
          const prestamo = await tx.prestamo.findUnique({ where: { id: prestamoIdNuevo } });
          if (prestamo) {
            const saldoBase = Number(prestamo.saldo) + abonoAnterior;
            if (abonoNuevo > saldoBase) throw new AppError(`El abono ($${abonoNuevo}) supera el saldo del préstamo ($${saldoBase})`, 400);
            const nuevoSaldo = saldoBase - abonoNuevo;
            await tx.prestamo.update({
              where: { id: prestamoIdNuevo },
              data:  { saldo: nuevoSaldo, activo: nuevoSaldo > 0 },
            });
          }
        }

        const updated = await tx.decoracion.update({
          where: { id },
          data,
          include: INCLUDE,
        });
        results.push(updated);
      }
      
      return results;
    });
  }

  async eliminar(id: string) {
    const dec = await prisma.decoracion.findUnique({ where: { id } });
    if (!dec) throw new AppError('Decoración no encontrada', 404);
    if (dec.pagado) throw new AppError('No se puede eliminar una decoración ya pagada', 400);

    return prisma.$transaction(async (tx) => {
      // Revertir saldo del préstamo (sin modificar cuotasPagadas)
      if (dec.prestamoId && Number(dec.abonosPrestamo) > 0) {
        await tx.prestamo.update({
          where: { id: dec.prestamoId },
          data:  { saldo: { increment: Number(dec.abonosPrestamo) }, activo: true },
        });
      }
      return tx.decoracion.delete({ where: { id } });
    });
  }

  async listar(params: PaginationParams & {
    decoradoraId?: string;
    pedidoId?:     string;
    pagado?:       boolean;
    fechaDesde?:   string;
    fechaHasta?:   string;
  }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (params.decoradoraId) where.decoradoraId = params.decoradoraId;
    if (params.pedidoId)     where.pedidoId     = params.pedidoId;
    if (params.pagado !== undefined) where.pagado = params.pagado;
    if (params.fechaDesde || params.fechaHasta) {
      where.fechaEgreso = {};
      if (params.fechaDesde) where.fechaEgreso.gte = new Date(params.fechaDesde + 'T00:00:00.000Z');
      if (params.fechaHasta) where.fechaEgreso.lte = new Date(params.fechaHasta + 'T23:59:59.999Z');
    }
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
    if (!dec) throw new AppError('Decoración no encontrada', 404);
    return dec;
  }

  async marcarPagado(id: string) {
    const dec = await prisma.decoracion.findUnique({ where: { id } });
    if (!dec) throw new AppError('Decoración no encontrada', 404);
    if (!dec.cantidadIngreso) throw new AppError('Registra el ingreso antes de pagar', 400);
    return prisma.decoracion.update({ where: { id }, data: { pagado: true } });
  }

  async pagarDecoraciones(ids: string[]) {
    const decoraciones = await prisma.decoracion.findMany({
      where: { id: { in: ids } },
      include: {
        decoradora: true,
      },
    });

    if (decoraciones.length === 0) throw new AppError('No se encontraron decoraciones', 404);

    const decoracionesSinPagar = decoraciones.filter(d => !d.pagado);
    if (decoracionesSinPagar.length === 0) throw new AppError('Todas las decoraciones ya están pagadas', 400);

    for (const dec of decoracionesSinPagar) {
      if (!dec.cantidadIngreso) throw new AppError(`La decoración ${dec.id} no tiene cantidad de ingreso`, 400);
    }

    await prisma.$transaction(
      decoracionesSinPagar.map(d => 
        prisma.decoracion.update({
          where: { id: d.id },
          data: { pagado: true },
        })
      )
    );

    return {
      decoracionesPagadas: decoracionesSinPagar.map(d => d.id),
    };
  }

  async listarAgrupado(params: PaginationParams & {
    decoradoraId?: string;
    pedidoId?:     string;
    pagado?:       boolean;
    fechaDesde?:   string;
    fechaHasta?:   string;
  }) {
    const where: any = {};
    if (params.decoradoraId) where.decoradoraId = params.decoradoraId;
    if (params.pedidoId)     where.pedidoId     = params.pedidoId;
    if (params.pagado !== undefined) where.pagado = params.pagado;
    if (params.fechaDesde || params.fechaHasta) {
      where.fechaEgreso = {};
      if (params.fechaDesde) where.fechaEgreso.gte = new Date(params.fechaDesde + 'T00:00:00.000Z');
      if (params.fechaHasta) where.fechaEgreso.lte = new Date(params.fechaHasta + 'T23:59:59.999Z');
    }

    const decoraciones = await prisma.decoracion.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        pedido: { select: { id: true, codigo: true, cliente: { select: { nombre: true } } } },
        decoradora: { select: { id: true, nombre: true, documento: true } },
        producto: { select: { id: true, nombre: true, precioDecoracion: true } },
        prestamo: { select: { id: true, monto: true, saldo: true } },
      },
    });

    const grupos: Record<string, any> = {};

    for (const dec of decoraciones) {
      const key = `${dec.pedidoId}-${dec.decoradoraId}`;
      if (!grupos[key]) {
        grupos[key] = {
          pedidoId: dec.pedidoId,
          pedidoCodigo: dec.pedido.codigo,
          clienteNombre: dec.pedido.cliente?.nombre,
          decoradoraId: dec.decoradoraId,
          decoradoraNombre: dec.decoradora.nombre,
          decoradoraDocumento: dec.decoradora.documento,
          productos: [],
          totalCantidadEgreso: 0,
          totalCantidadIngreso: 0,
          totalCompras: 0,
          totalAPagar: 0,
          todosPagados: true,
          decorationIds: [],
        };
      }

      grupos[key].productos.push({
        id: dec.id,
        productoId: dec.productoId,
        productoNombre: dec.producto.nombre,
        precioDecoracion: dec.precioDecoracion,
        cantidadEgreso: dec.cantidadEgreso,
        cantidadIngreso: dec.cantidadIngreso,
        arreglos: dec.arreglos,
        perdidas: dec.perdidas,
        compras: dec.compras,
        total: dec.total,
        totalPagar: dec.totalPagar,
        fechaEgreso: dec.fechaEgreso,
        fechaIngreso: dec.fechaIngreso,
        pagado: dec.pagado,
        prestamoId: dec.prestamoId,
        abonosPrestamo: dec.abonosPrestamo,
        createdAt: dec.createdAt,
        prestamo: dec.prestamo,
      });

      grupos[key].totalCantidadEgreso += dec.cantidadEgreso;
      grupos[key].totalCantidadIngreso += dec.cantidadIngreso || 0;
      grupos[key].totalCompras += Number(dec.compras) || 0;
      grupos[key].totalAPagar += Number(dec.totalPagar) || 0;
      grupos[key].todosPagados = grupos[key].todosPagados && dec.pagado;
      grupos[key].decorationIds.push(dec.id);
    }

    const items = Object.values(grupos);
    return { items, total: items.length };
  }

  async reportePorGrupo(params: {
    grupoId?: string;
    decoradoraId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    search?: string;
    incluirPagadas?: boolean;
  }) {
    const where: any = {};
    
    if (params.decoradoraId) where.decoradoraId = params.decoradoraId;
    if (!params.incluirPagadas) where.pagado = false;
    
    if (params.fechaDesde || params.fechaHasta) {
      where.fechaEgreso = {};
      if (params.fechaDesde) where.fechaEgreso.gte = new Date(params.fechaDesde + 'T00:00:00.000Z');
      if (params.fechaHasta) where.fechaEgreso.lte = new Date(params.fechaHasta + 'T23:59:59.999Z');
    }
    
    if (params.search) {
      where.OR = [
        { decoradora: { nombre: { contains: params.search, mode: 'insensitive' } } },
        { pedido: { codigo: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    let grupoFilter: any = {};
    if (params.grupoId) {
      const decoradorasDelGrupo = await prisma.decoradora.findMany({
        where: { grupoId: params.grupoId },
        select: { id: true }
      });
      const ids = decoradorasDelGrupo.map(d => d.id);
      where.decoradoraId = { in: ids };
    }

    const decoraciones = await prisma.decoracion.findMany({
      where,
      include: {
        decoradora: {
          include: {
            grupo: true
          }
        },
        pedido: { select: { codigo: true } },
        producto: { select: { nombre: true } },
      },
      orderBy: { decoradora: { nombre: 'asc' } },
    });

    const grupoInfo = params.grupoId ? await prisma.grupo.findUnique({
      where: { id: params.grupoId },
    }) : null;

    const porDecoradora = decoraciones.reduce((acc: any, dec) => {
      const key = dec.decoradoraId;
      if (!acc[key]) {
        acc[key] = {
          decoradoraId: dec.decoradoraId,
          decoradoraNombre: dec.decoradora.nombre,
          decoradoraDocumento: dec.decoradora.documento,
          decoradoraNumCuenta: dec.decoradora.numCuenta,
          decoradoraBanco: dec.decoradora.banco,
          decoradoraTipoCuenta: dec.decoradora.tipoCuenta,
          grupoId: dec.decoradora.grupoId,
          grupoNombre: dec.decoradora.grupo?.nombre,
          grupoTipo: dec.decoradora.grupo?.tipo,
          esResponsable: dec.decoradora.grupo?.responsable === dec.decoradora.documento,
          porcentajeAdicional: dec.decoradora.grupo?.porcentajeResponsable || 0,
          cantidadDecoraciones: 0,
          totalEgresos: 0,
          totalCompras: 0,
          totalAbonosPrestamo: 0,
          saldoPrestamos: 0,
          decoraciones: [],
        };
      }
      acc[key].cantidadDecoraciones += 1;
      acc[key].totalEgresos += Number(dec.total) || 0;
      acc[key].totalCompras += Number(dec.compras) || 0;
      acc[key].totalAbonosPrestamo += Number(dec.abonosPrestamo) || 0;
      acc[key].decoraciones.push(dec);

      if (dec.prestamoId) {
        acc[key].saldoPrestamos += Number(dec.totalPagar) || 0;
      }

      return acc;
    }, {});

    const items = Object.values(porDecoradora).map((d: any) => {
      const subtotal = d.totalEgresos - d.totalCompras - d.totalAbonosPrestamo;
      let totalAPagar = subtotal;
      let calculoPorcentaje = null;
      
      if (d.esResponsable && d.porcentajeAdicional > 0) {
        const otrosMiembros = Object.values(porDecoradora).filter((od: any) => 
          od.grupoId === d.grupoId && od.decoradoraId !== d.decoradoraId
        );
        const totalOtros = otrosMiembros.reduce((sum: number, od: any) => 
          sum + (od.totalEgresos - od.totalCompras - od.totalAbonosPrestamo), 0
        );
        const adicional = totalOtros * (d.porcentajeAdicional / 100);
        totalAPagar = subtotal + adicional;
        calculoPorcentaje = {
          totalOtrosMiembros: totalOtros,
          porcentaje: d.porcentajeAdicional,
          adicional: adicional,
        };
      }

      return {
        ...d,
        subtotal,
        totalAPagar,
        calculoPorcentaje,
      };
    });

    return {
      grupo: grupoInfo,
      items,
      totales: {
        cantidadDecoraciones: items.reduce((sum, d) => sum + d.cantidadDecoraciones, 0),
        totalEgresos: items.reduce((sum, d) => sum + d.totalEgresos, 0),
        totalCompras: items.reduce((sum, d) => sum + d.totalCompras, 0),
        totalAbonosPrestamo: items.reduce((sum, d) => sum + d.totalAbonosPrestamo, 0),
        saldoPrestamos: items.reduce((sum, d) => sum + d.saldoPrestamos, 0),
        subtotal: items.reduce((sum, d) => sum + d.subtotal, 0),
        totalAPagar: items.reduce((sum, d) => sum + d.totalAPagar, 0),
      }
    };
  }
}

export const decoracionesService = new DecoracionesService();
