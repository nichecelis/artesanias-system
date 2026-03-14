import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(authenticate, authorize('ADMINISTRADOR', 'CONTABILIDAD', 'VENTAS'));

const rangoFechasSchema = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
});

// Reporte: ventas por cliente en rango de fechas
router.get('/ventas-por-cliente', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta } = rangoFechasSchema.parse(req.query);
    const data = await prisma.pedido.groupBy({
      by: ['clienteId'],
      where: { createdAt: { gte: desde, lte: hasta } },
      _count: { id: true },
      _sum:   { cantidadPedido: true, cantidadDespacho: true },
    });
    // Enriquecer con nombres de clientes
    const clienteIds = data.map((d: any) => d.clienteId);
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nombre: true },
    });
    const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));
    const result = data.map((d: any) => ({
      ...d,
      clienteNombre: clienteMap.get(d.clienteId) ?? 'Desconocido',
    }));
    sendSuccess(res, result);
  } catch (error) { next(error); }
});

// Reporte: pedidos activos con estado
router.get('/pedidos-activos', async (_req, res, next) => {
  try {
    const data = await prisma.pedido.findMany({
      where: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
      include: { cliente: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, data);
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
    const totalNomina = data.reduce((acc: number, n: any) => acc + Number(n.totalPagar), 0);
    sendSuccess(res, { nominas: data, totalNomina, mes });
  } catch (error) { next(error); }
});

export default router;
