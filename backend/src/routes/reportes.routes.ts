import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticate, authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'));

const rangoFechasSchema = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
});

// Reporte: ventas por cliente en rango de fechas
router.get('/ventas-por-cliente', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta } = rangoFechasSchema.parse(req.query);
    
    const pedidos = await prisma.pedido.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      select: {
        clienteId: true,
        productos: {
          select: {
            cantidadPedido: true,
            cantidadDespacho: true,
          }
        }
      },
    });

    const clienteIds = [...new Set(pedidos.map((p) => p.clienteId))];
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nombre: true },
    });
    const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));

    const result = clienteIds.map((clienteId) => {
      const clientePedidos = pedidos.filter((p) => p.clienteId === clienteId);
      const totalPedido = clientePedidos.reduce((acc, p) => 
        acc + p.productos.reduce((a, pp) => a + pp.cantidadPedido, 0), 0
      );
      const totalDespachado = clientePedidos.reduce((acc, p) => 
        acc + p.productos.reduce((a, pp) => a + (pp.cantidadDespacho || 0), 0), 0
      );
      return {
        clienteId,
        clienteNombre: clienteMap.get(clienteId) ?? 'Desconocido',
        cantidadPedidos: clientePedidos.length,
        _sum: { cantidadPedido: totalPedido, cantidadDespacho: totalDespachado },
      };
    });

    sendSuccess(res, result);
  } catch (error) { next(error); }
});

// Reporte: pedidos activos con estado
router.get('/pedidos-activos', async (_req, res, next) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
      include: { cliente: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const porEstado = await prisma.pedido.groupBy({
      by: ['estado'],
      where: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
      _count: { id: true },
    });

    sendSuccess(res, { porEstado, pedidos });
  } catch (error) { next(error); }
});

// Reporte: pagos pendientes a decoradoras
router.get('/pagos-decoradoras', async (_req, res, next) => {
  try {
    const data = await prisma.decoracion.findMany({
      where: { pagado: false, fechaIngreso: { not: null } },
      include: {
        decoradora: { select: { nombre: true } },
        pedido:     { select: { codigo: true } },
        producto:   { select: { nombre: true } },
      },
      orderBy: { fechaIngreso: 'asc' },
    });
    const totalPendiente = data.reduce((acc: number, d: any) => acc + Number(d.totalPagar), 0);
    sendSuccess(res, { decoraciones: data, totalPendiente });
  } catch (error) { next(error); }
});

// Reporte: nómina del mes
router.get('/nomina-mes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mes } = z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query);
    const [year, month] = mes.split('-').map(Number);
    const data = await prisma.nomina.findMany({
      where: {
        fecha: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
      },
      include: { empleado: { select: { nombre: true, salario: true } } },
      orderBy: { empleado: { nombre: 'asc' } },
    });

    const nominas = data.map((n: any) => ({
      id: n.id,
      empleadoId: n.empleadoId,
      empleado: n.empleado,
      fecha: n.fecha,
      diasTrabajados: n.diasTrabajados,
      salarioDia: Number(n.salarioDia),
      subtotalDias: Number(n.subtotalDias),
      horasExtras: Number(n.horasExtras),
      valorHoraExtra: Number(n.valorHoraExtra),
      subtotalHoras: Number(n.subtotalHoras),
      totalDevengado: Number(n.subtotalDias) + Number(n.subtotalHoras),
      abonosPrestamo: Number(n.abonosPrestamo),
      descuentos: Number(n.abonosPrestamo),
      totalPagar: Number(n.totalPagar),
      totalNeto: Number(n.totalPagar),
      observaciones: n.observaciones,
    }));

    const totales = nominas.reduce((acc: any, n: any) => ({
      totalDevengado: acc.totalDevengado + n.totalDevengado,
      totalDescuentos: acc.totalDescuentos + n.descuentos,
      totalNeto: acc.totalNeto + n.totalNeto,
    }), { totalDevengado: 0, totalDescuentos: 0, totalNeto: 0 });

    sendSuccess(res, { nominas, totales, mes });
  } catch (error) { next(error); }
});

export default router;
