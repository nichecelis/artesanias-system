import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TipoCuenta } from '@prisma/client';

import { authenticate, authorize } from '../middlewares/auth.middleware';
import { decoradorasService }   from '../services/decoradoras.service';
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
  telefono:   z.string().optional(),
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

decoradorasRouter.get('/', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      activa: req.query.activa as string | boolean | undefined,
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

decoradorasRouter.get('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), (req, res, next) => handleObtener(req, res, next, (id) => decoradorasService.obtenerPorId(id)));
decoradorasRouter.patch('/:id/inactivar', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoradorasService.inactivar(req.params.id);
    sendSuccess(res, data, 'Decoradora inactivada');
  } catch (error) { next(error); }
});
decoradorasRouter.patch('/:id/activar', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoradorasService.activar(req.params.id);
    sendSuccess(res, data, 'Decoradora activada');
  } catch (error) { next(error); }
});
decoradorasRouter.patch('/:id', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = decoradoraUpdateSchema.parse(req.body);
    const updateData: any = {};
    if (parsed.nombre !== undefined) updateData.nombre = parsed.nombre;
    if (parsed.documento !== undefined) updateData.documento = parsed.documento;
    if (parsed.telefono !== undefined && parsed.telefono !== null) updateData.telefono = parsed.telefono;
    if (parsed.grupoId !== undefined) updateData.grupoId = parsed.grupoId;
    if (parsed.banco !== undefined && parsed.banco !== null) updateData.banco = parsed.banco;
    if (parsed.numCuenta !== undefined && parsed.numCuenta !== null) updateData.numCuenta = parsed.numCuenta;
    if (parsed.tipoCuenta !== undefined) updateData.tipoCuenta = parsed.tipoCuenta;
    
    const data = await decoradorasService.actualizar(req.params.id, updateData);
    sendSuccess(res, data, 'Actualizada');
  } catch (error) { next(error); }
});
decoradorasRouter.get('/:id/pagos', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoradorasService.resumenPagos(req.params.id);
    sendSuccess(res, data);
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
    const params = {
      ...parsePagination(req.query as any),
      activo: req.query.activo as string | boolean | undefined,
    };
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
empleadosRouter.patch('/:id/inactivar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await empleadosService.inactivar(req.params.id);
    sendSuccess(res, data, 'Empleado inactivado');
  } catch (error) { next(error); }
});
empleadosRouter.patch('/:id/activar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await empleadosService.activar(req.params.id);
    sendSuccess(res, data, 'Empleado activado');
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