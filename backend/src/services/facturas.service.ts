import { prisma } from '../config/database';
import { AppError } from '../types';

export class FacturasService {

  async listar(params: { page: number; limit: number; search?: string; clienteId?: string; fechaDesde?: string; fechaHasta?: string }) {
    const { page = 1, limit = 20, search, clienteId, fechaDesde, fechaHasta } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clienteId) where.clienteId = clienteId;
    if (search) where.cliente = { nombre: { contains: search, mode: 'insensitive' } };
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const f = new Date(fechaHasta);
        where.fecha.lte = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59);
      }
    }

    const [items, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true, documento: true, direccion: true, telefono: true } },
          items: {
            include: {
              pedidoProducto: {
                include: {
                  producto: { select: { nombre: true } },
                  pedido: { select: { codigo: true, createdAt: true } },
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        skip,
        take: limit,
        orderBy: { fecha: 'desc' }
      }),
      prisma.factura.count({ where })
    ]);

    return { items, total, page, limit };
  }

  async obtenerPorId(id: string) {
    if (!id) throw new AppError('ID requerido', 400);

    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: {
          include: {
            pedidoProducto: {
              include: {
                producto: { select: { id: true, nombre: true, descripcion: true, precioVenta: true } },
                pedido: { select: { codigo: true, createdAt: true } },
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!factura) throw new AppError('Factura no encontrada', 404);

    const productoIds = factura.items.map(item => item.pedidoProducto.productoId);
    const preciosEspeciales = await prisma.productoCliente.findMany({
      where: {
        clienteId: factura.clienteId,
        productoId: { in: productoIds },
      },
    });

    const preciosMap = new Map(preciosEspeciales.map(pe => [pe.productoId, Number(pe.precioVenta)]));

    const itemsConPreciosEspeciales = factura.items.map(item => {
      const precioEspecial = preciosMap.get(item.pedidoProducto.productoId);
      const precioOriginal = Number(item.pedidoProducto.producto.precioVenta);
      const precioUnitario = precioEspecial !== undefined ? precioEspecial : precioOriginal;
      
      return {
        ...item,
        precioUnitarioOriginal: item.precioUnitario,
        precioUnitario,
        precioOriginal,
        esPrecioEspecial: precioEspecial !== undefined,
      };
    });

    return {
      ...factura,
      items: itemsConPreciosEspeciales,
    };
  }

  async crear(dto: {
    clienteId: string;
    fecha: string;
    descuento?: number;
    montoPagado?: number;
    observaciones?: string;
    items: Array<{
      pedidoProductoId: string;
      cantidad: number;
      precioUnitario: number;
      descuento?: number;
    }>;
  }) {
    if (!dto.clienteId) throw new AppError('Cliente requerido', 400);
    if (!dto.items?.length) throw new AppError('Debe incluir al menos un producto', 400);

    const cliente = await prisma.cliente.findUnique({ where: { id: dto.clienteId } });
    if (!cliente) throw new AppError('Cliente no encontrado', 404);

    const numero = await this.generarNumeroFactura();

    const subtotal = dto.items.reduce((acc, item) => {
      return acc + (item.cantidad * item.precioUnitario - (item.descuento ?? 0));
    }, 0);

    const descuentoTotal = dto.items.reduce((acc, item) => acc + (item.descuento ?? 0), 0) + (dto.descuento ?? 0);
    const total = subtotal;

    const saldoAnterior = await this.obtenerSaldoAnterior(dto.clienteId);
    const montoPagado = dto.montoPagado ?? 0;
    const saldo = total + saldoAnterior - montoPagado;
    const totalPagar = saldo;

    const fecha = new Date(dto.fecha + 'T12:00:00.000Z');

    const factura = await prisma.factura.create({
      data: {
        numero,
        clienteId: dto.clienteId,
        fecha,
        subtotal,
        descuento: descuentoTotal,
        total,
        saldoAnterior,
        montoPagado,
        saldo,
        totalPagar,
        observaciones: dto.observaciones,
        items: {
          create: dto.items.map(item => ({
            pedidoProductoId: item.pedidoProductoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            total: item.cantidad * item.precioUnitario,
            descuento: item.descuento ?? 0,
          }))
        }
      },
      include: {
        cliente: true,
        items: {
          include: {
            pedidoProducto: {
              include: {
                producto: true,
                pedido: true,
              }
            }
          }
        }
      }
    });

    return factura;
  }

  async actualizar(id: string, dto: any) {
    if (!id) throw new AppError('ID requerido', 400);

    const existente = await prisma.factura.findUnique({ where: { id } });
    if (!existente) throw new AppError('Factura no encontrada', 404);

    const updateData: any = { ...dto };
    if (dto.fecha) {
      updateData.fecha = new Date(dto.fecha + 'T12:00:00.000Z');
    }

    return prisma.factura.update({
      where: { id },
      data: updateData,
      include: { cliente: true }
    });
  }

  async eliminar(id: string) {
    if (!id) throw new AppError('ID requerido', 400);
    const existente = await prisma.factura.findUnique({ where: { id } });
    if (!existente) throw new AppError('Factura no encontrada', 404);

    await prisma.factura.delete({ where: { id } });
    return { deleted: true };
  }

  async generarNumeroFactura(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.factura.count({
      where: { numero: { startsWith: `FAC-${year}` } }
    });
    const next = count + 1;
    return `FAC-${year}-${String(next).padStart(5, '0')}`;
  }

  async obtenerPedidosDisponibles(clienteId: string) {
    const pedidos = await prisma.pedido.findMany({
      where: {
        clienteId,
        estado: { in: ['LISTO', 'DESPACHADO'] },
      },
      include: {
        productos: {
          include: {
            producto: { select: { id: true, nombre: true, precioVenta: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pedidoProductoIds = pedidos.flatMap(p => p.productos.map(pr => pr.id));

    const facturados = await prisma.facturaItem.groupBy({
      by: ['pedidoProductoId'],
      where: { pedidoProductoId: { in: pedidoProductoIds } },
      _sum: { cantidad: true },
    });

    const facturadoMap = new Map(facturados.map(f => [f.pedidoProductoId, Number(f._sum.cantidad || 0)]));

    const preciosMap = new Map<string, number>();
    if (pedidoProductoIds.length > 0) {
      const productoIds = [...new Set(pedidos.flatMap(p => p.productos.map(pr => pr.productoId)))];
      const preciosEspeciales = await prisma.productoCliente.findMany({
        where: { clienteId, productoId: { in: productoIds } },
      });
      preciosEspeciales.forEach(pe => preciosMap.set(pe.productoId, Number(pe.precioVenta)));
    }

    const pedidosDisponibles = pedidos.map(pedido => {
      let totalDespachado = 0;
      let totalFacturado = 0;

      const productosConInfo = pedido.productos.map(p => {
        const cantidadDespacho = p.cantidadDespacho ?? p.cantidadPedido;
        const cantidadFacturada = facturadoMap.get(p.id) || 0;
        const cantidadParaFacturar = Math.max(cantidadDespacho, p.cantidadPedido);
        const cantidadPendiente = cantidadParaFacturar - cantidadFacturada;
        totalDespachado += cantidadDespacho;
        totalFacturado += cantidadFacturada;
        return { ...p, cantidadDespacho, cantidadFacturada, cantidadPendiente, cantidadParaFacturar };
      });

      const productosConInfoFinal = productosConInfo
        .filter(p => p.cantidadPendiente > 0)
        .map(p => {
          const precioEspecial = preciosMap.get(p.productoId);
          const precioUnitario = precioEspecial !== undefined ? precioEspecial : Number(p.producto.precioVenta);
          return {
            id: p.id,
            nombre: p.producto.nombre,
            cantidad: p.cantidadParaFacturar,
            precioUnitario,
            precioOriginal: Number(p.producto.precioVenta),
            esPrecioEspecial: precioEspecial !== undefined,
            total: precioUnitario * p.cantidadParaFacturar,
            cantidadDespacho: p.cantidadDespacho,
            cantidadFacturada: p.cantidadFacturada,
            cantidadPendiente: p.cantidadPendiente,
            cantidadPedido: p.cantidadPedido,
            corte1: p.corte1,
            corte2: p.corte2,
            corte3: p.corte3,
          };
        });

      if (productosConInfoFinal.length === 0) return null;

      return {
        id: pedido.id,
        codigo: pedido.codigo,
        fecha: pedido.createdAt,
        productos: productosConInfoFinal,
      };
    });

    return pedidosDisponibles.filter((p): p is NonNullable<typeof p> => p !== null);
  }

  async obtenerSaldoAnterior(clienteId: string, facturaId?: string) {
    const where: any = { clienteId };
    if (facturaId) where.id = { not: facturaId };
    
    const facturas = await prisma.factura.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 1
    });

    if (facturas.length > 0) {
      return Number(facturas[0].totalPagar);
    }
    return 0;
  }
}

export const facturasService = new FacturasService();
