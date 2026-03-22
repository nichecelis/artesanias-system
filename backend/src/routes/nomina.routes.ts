import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { prisma } from '../config/database';
import { sendSuccess, parsePagination } from '../utils/response';
import { AppError } from '../types';

export const nominaRouter = Router();
nominaRouter.use(authenticate);

const uuidOpcional = z.union([z.string().uuid(), z.literal(''), z.null()]).transform(v => v === '' ? null : v).optional();

const nominaSchema = z.object({
  empleadoId:     z.string().uuid(),
  fecha:          z.string(),
  diasTrabajados: z.coerce.number().int().min(0).max(31),
  horasExtras:    z.coerce.number().min(0).optional(),
  prestamoId:     uuidOpcional,
  abonosPrestamo: z.coerce.number().min(0).optional(),
  observaciones:  z.string().optional(),
});

const nominaUpdateSchema = z.object({
  fecha:          z.string().optional(),
  diasTrabajados: z.coerce.number().int().min(0).max(31).optional(),
  horasExtras:    z.coerce.number().min(0).optional(),
  prestamoId:     uuidOpcional,
  abonosPrestamo: z.coerce.number().min(0).optional(),
  observaciones:  z.string().optional(),
});

const incluir = {
  empleado: { select: { id: true, nombre: true, documento: true, salario: true } },
  prestamo: { select: { id: true, monto: true, saldo: true } },
};

function calcular(empleado: any, dto: any) {
  const salarioDia = Number(empleado.salario) / 30;
  const subtotalDias = Math.round(salarioDia * (dto.diasTrabajados ?? 30));
  const valorHoraExtra = Math.round(salarioDia / 9);
  const subtotalHoras = Math.round(valorHoraExtra * (dto.horasExtras ?? 0));
  const totalPagar = Math.round(subtotalDias + subtotalHoras - (dto.abonosPrestamo ?? 0));
  return { salarioDia, subtotalDias, valorHoraExtra, subtotalHoras, totalPagar };
}

nominaRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parsePagination(req.query as any);
    const where: any = {};
    
    if (req.query.search) {
      where.empleado = { nombre: { contains: req.query.search as string, mode: 'insensitive' } };
    }
    if (req.query.mes) {
      const [year, month] = (req.query.mes as string).split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.fecha = { gte: startDate, lte: endDate };
    }
    if (req.query.fecha) {
      const fechaStr = req.query.fecha as string;
      const fechaDate = new Date(fechaStr);
      where.fecha = {
        gte: new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate(), 0, 0, 0),
        lte: new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate(), 23, 59, 59),
      };
    }

    const [data, total] = await Promise.all([
      prisma.nomina.findMany({
        where,
        include: incluir,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { fecha: 'desc' },
      }),
      prisma.nomina.count({ where }),
    ]);

    res.json({ success: true, data, meta: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) } });
  } catch (e) { next(e); }
});

nominaRouter.post('/', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = nominaSchema.parse(req.body);
    const emp = await prisma.empleado.findUnique({ where: { id: item.empleadoId } });
    if (!emp) throw new AppError(404, `Empleado ${item.empleadoId} no encontrado`);
    const { salarioDia, subtotalDias, valorHoraExtra, subtotalHoras, totalPagar } = calcular(emp, item);
    const [y, m, d] = item.fecha.split('-');
    const reg = await prisma.nomina.create({
      data: {
        empleadoId: item.empleadoId,
        fecha: new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0),
        diasTrabajados: item.diasTrabajados,
        salarioDia,
        horasExtras: item.horasExtras ?? 0,
        valorHoraExtra,
        subtotalDias,
        subtotalHoras,
        abonosPrestamo: item.abonosPrestamo ?? 0,
        totalPagar,
        observaciones: item.observaciones,
        prestamoId: item.prestamoId ?? null,
      },
      include: incluir,
    });
    if (item.prestamoId && item.abonosPrestamo) {
      await prisma.prestamo.update({ where: { id: item.prestamoId }, data: { saldo: { decrement: item.abonosPrestamo } } });
    }
    sendSuccess(res, reg, 'Registro de nómina creado');
  } catch (e) { next(e); }
});

nominaRouter.patch('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = nominaUpdateSchema.parse(req.body);
    const actual = await prisma.nomina.findUnique({ where: { id: req.params.id }, include: incluir });
    if (!actual) throw new AppError(404, 'Registro no encontrado');

    if (actual.prestamoId && Number(actual.abonosPrestamo) > 0) {
      await prisma.prestamo.update({ where: { id: actual.prestamoId }, data: { saldo: { increment: Number(actual.abonosPrestamo) } } });
    }

    const emp = await prisma.empleado.findUnique({ where: { id: actual.empleadoId } });
    const datos: any = { ...dto };
    if (dto.fecha) {
      const [y, m, d] = dto.fecha.split('-');
      datos.fecha = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    }
    const { salarioDia, subtotalDias, valorHoraExtra, subtotalHoras, totalPagar } = calcular(emp!, { diasTrabajados: dto.diasTrabajados ?? actual.diasTrabajados, horasExtras: dto.horasExtras ?? Number(actual.horasExtras), abonosPrestamo: dto.abonosPrestamo ?? Number(actual.abonosPrestamo) });
    datos.salarioDia = salarioDia;
    datos.subtotalDias = subtotalDias;
    datos.valorHoraExtra = valorHoraExtra;
    datos.subtotalHoras = subtotalHoras;
    datos.totalPagar = totalPagar;
    if (dto.prestamoId && (dto.abonosPrestamo ?? 0) > 0) {
      await prisma.prestamo.update({ where: { id: dto.prestamoId }, data: { saldo: { decrement: dto.abonosPrestamo } } });
    }

    const updated = await prisma.nomina.update({ where: { id: req.params.id }, data: datos, include: incluir });
    sendSuccess(res, updated, 'Registro actualizado');
  } catch (e) { next(e); }
});

nominaRouter.delete('/:id', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actual = await prisma.nomina.findUnique({ where: { id: req.params.id } });
    if (!actual) throw new AppError(404, 'Registro no encontrado');
    if (actual.prestamoId && Number(actual.abonosPrestamo) > 0) {
      await prisma.prestamo.update({ where: { id: actual.prestamoId }, data: { saldo: { increment: Number(actual.abonosPrestamo) } } });
    }
    await prisma.nomina.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Registro eliminado');
  } catch (e) { next(e); }
});

nominaRouter.get('/total-mes', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mes } = req.query as { mes?: string };
    let startDate: Date, endDate: Date;

    if (mes) {
      const [year, month] = mes.split('-').map(Number);
      startDate = new Date(year, month - 1, 1, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [nominas, totalNomina] = await Promise.all([
      prisma.nomina.findMany({
        where: { fecha: { gte: startDate, lte: endDate } },
        include: { empleado: { select: { nombre: true } } },
        orderBy: { fecha: 'desc' },
      }),
      prisma.nomina.aggregate({
        where: { fecha: { gte: startDate, lte: endDate } },
        _sum: { totalPagar: true },
      }),
    ]);

    sendSuccess(res, { nominas, totalNomina: totalNomina._sum.totalPagar ?? 0 });
  } catch (e) { next(e); }
});
