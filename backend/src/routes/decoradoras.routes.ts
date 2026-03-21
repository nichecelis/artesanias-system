import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoCuenta } from '@prisma/client';

import { authenticate, authorize } from '../middlewares/auth.middleware';
import { decoradorasService }   from '../services/decoradoras.service';
import { decoracionesService }  from '../services/decoraciones.service';
import { prestamosService }     from '../services/prestamos.service';
import { empleadosService, nominaService } from '../services/empleados.service';
import { sendSuccess, parsePagination, sendPaginated } from '../utils/response';
import { handleObtener } from '../controllers/base.controller';

// ─── Decoradoras ──────────────────────────────────────────────
export const decoradorasRouter = Router();
decoradorasRouter.use(authenticate);

const grupoIdSchema = z.union([
  z.string().uuid(),
  z.string().min(1),
  z.literal(''),
]).transform(v => v === '' ? null : v).optional();

const decoradoraSchema = z.object({
  nombre:     z.string().min(2).max(200),
  documento:  z.string().min(3).max(20),
  telefono:   z.string().optional(),
  grupoId:    grupoIdSchema,
  banco:      z.string().optional(),
  numCuenta:  z.string().optional(),
  tipoCuenta: z.nativeEnum(TipoCuenta).optional(),
});

const decoradoraUpdateSchema = z.object({
  nombre:     z.string().min(2).max(200).optional(),
  documento:  z.string().min(3).max(20).optional(),
  telefono:   z.string().optional().nullable(),
  grupoId:    z.union([
    z.string().uuid(),
    z.string().min(1),
    z.literal(''),
    z.null(),
  ]).transform(v => v === '' ? null : v).optional().nullable(),
  banco:      z.string().optional().nullable(),
  numCuenta:  z.string().optional().nullable(),
  tipoCuenta: z.nativeEnum(TipoCuenta).optional().nullable(),
});

decoradorasRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),

    };
    const result = await decoradorasService.listar(params);
    sendPaginated(res, result, params);
  } catch (error) { next(error); }
});

decoradorasRouter.post('/', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoradorasService.crear(decoradoraSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

decoradorasRouter.get('/:id',        (req, res, next) => handleObtener(req, res, next, (id) => decoradorasService.obtenerPorId(id)));
decoradorasRouter.patch('/:id', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoradorasService.actualizar(req.params.id, decoradoraUpdateSchema.parse(req.body));
    sendSuccess(res, data, 'Actualizada');
  } catch (error) { next(error); }
});
decoradorasRouter.get('/:id/pagos',  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoradorasService.resumenPagos(req.params.id);
    sendSuccess(res, data);
  } catch (error) { next(error); }
});


// ─── Decoraciones (egreso / ingreso) ─────────────────────────
export const decoracionesRouter = Router();
decoracionesRouter.use(authenticate);

const egresoSchema = z.object({
  pedidoId:         z.string().uuid(),
  decoradoraId:     z.string().uuid(),
  productoId:       z.string().uuid(),
  fechaEgreso:      z.coerce.date(),
  cantidadEgreso:   z.number().int().positive(),
  precioDecoracion: z.number().positive(),
});

const ingresoSchema = z.object({
  fechaIngreso:    z.coerce.date(),
  cantidadIngreso: z.number().int().positive(),
  arreglos:        z.number().int().optional(),
  perdidas:        z.number().int().optional(),
  compras:         z.number().optional(),
});

decoracionesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      decoradoraId:      req.query.decoradoraId as string | undefined,
      pedidoId:          req.query.pedidoId as string | undefined,
      soloSinIngreso:    req.query.soloSinIngreso === 'true',
      soloPendientePago: req.query.soloPendientePago === 'true',
    };
    const result = await decoracionesService.listar(params);
    sendPaginated(res, result, params);
  } catch (error) { next(error); }
});

decoracionesRouter.post('/egreso', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoracionesService.registrarEgreso(egresoSchema.parse(req.body));
    res.status(201).json({ success: true, data, message: 'Egreso registrado' });
  } catch (error) { next(error); }
});

decoracionesRouter.patch('/:id/ingreso', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoracionesService.registrarIngreso(req.params.id, ingresoSchema.parse(req.body));
    sendSuccess(res, data, 'Ingreso registrado');
  } catch (error) { next(error); }
});

decoracionesRouter.patch('/:id/pagar', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoracionesService.marcarPagado(req.params.id);
    sendSuccess(res, data, 'Marcado como pagado');
  } catch (error) { next(error); }
});


// ─── Préstamos ────────────────────────────────────────────────
export const prestamosRouter = Router();
prestamosRouter.use(authenticate);

const prestamoSchema = z.object({
  decoradoraId: z.string().uuid(),
  monto:        z.number().positive(),
  fecha:        z.coerce.date(),
  observacion:  z.string().optional(),
});

const abonoSchema = z.object({
  monto: z.number().positive(),
  fecha: z.coerce.date(),
});

prestamosRouter.post('/', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prestamosService.crear(prestamoSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
prestamosRouter.get('/decoradora/:decoradoraId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prestamosService.listarPorDecoradora(req.params.decoradoraId);
    sendSuccess(res, data);
  } catch (error) { next(error); }
});
prestamosRouter.post('/:id/abonos', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prestamosService.abonar(req.params.id, abonoSchema.parse(req.body));
    res.status(201).json({ success: true, data, message: 'Abono registrado' });
  } catch (error) { next(error); }
});


// ─── Empleados ────────────────────────────────────────────────
export const empleadosRouter = Router();
empleadosRouter.use(authenticate, authorize('ADMINISTRADOR', 'CONTABILIDAD'));

const empleadoSchema = z.object({
  nombre:    z.string().min(2).max(200),
  documento: z.string().min(3).max(20),
  salario:   z.number().positive(),
});

empleadosRouter.get('/',    async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parsePagination(req.query as any);
    const result = await empleadosService.listar(params);
    sendPaginated(res, result, params);
  } catch (error) { next(error); }
});
empleadosRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await empleadosService.crear(empleadoSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
empleadosRouter.get('/:id',   (req, res, next) => handleObtener(req, res, next, (id) => empleadosService.obtenerPorId(id)));
empleadosRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await empleadosService.actualizar(req.params.id, empleadoSchema.partial().parse(req.body));
    sendSuccess(res, data, 'Actualizado');
  } catch (error) { next(error); }
});


// ─── Nómina ───────────────────────────────────────────────────
export const nominaRouter = Router();
nominaRouter.use(authenticate, authorize('ADMINISTRADOR', 'CONTABILIDAD'));

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

const actualizarNominaSchema = z.object({
  fecha:          z.string().optional(),
  diasTrabajados: z.coerce.number().int().min(0).max(31).optional(),
  horasExtras:    z.coerce.number().min(0).optional(),
  prestamoId:     uuidOpcional,
  abonosPrestamo: z.coerce.number().min(0).optional(),
  observaciones:  z.string().optional(),
});

nominaRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      empleadoId: req.query.empleadoId as string | undefined,
      mes:        req.query.mes as string | undefined,
    };
    const result = await nominaService.listar(params);
    sendPaginated(res, result, params);
  } catch (error) { next(error); }
});
nominaRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await nominaService.registrar(nominaSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
nominaRouter.get('/total-mes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mes } = z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query);
    const data = await nominaService.totalMes(mes);
    sendSuccess(res, data);
  } catch (error) { next(error); }
});
