import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { gruposService } from '../services/grupos.service';
import { sendSuccess, parsePagination, sendPaginated } from '../utils/response';

export const gruposRouter = Router();
gruposRouter.use(authenticate);

const grupoSchema = z.object({
  nombre:      z.string().min(2).max(200),
  tipo:        z.enum(['GRUPO', 'ELITE']),
  direccion:   z.string().optional(),
  telefono:    z.string().optional(),
  responsable: z.string().optional(),
  porcentajeResponsable: z.coerce.number().min(0).max(100).optional(),
});

// Listar
gruposRouter.get('/', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = { ...parsePagination(req.query as any), activo: req.query.activo };
    const result = await gruposService.listar(params);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (e) { next(e); }
});

// Obtener por ID
gruposRouter.get('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await gruposService.obtener(req.params.id));
  } catch (e) { next(e); }
});

// Crear
gruposRouter.post('/', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await gruposService.crear(grupoSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

// Actualizar
gruposRouter.patch('/:id', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await gruposService.actualizar(req.params.id, grupoSchema.partial().parse(req.body)), 'Grupo actualizado');
  } catch (e) { next(e); }
});

// Inactivar
gruposRouter.patch('/:id/inactivar', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await gruposService.inactivar(req.params.id), 'Grupo inactivado');
  } catch (e) { next(e); }
});

// Activar
gruposRouter.patch('/:id/activar', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await gruposService.activar(req.params.id), 'Grupo activado');
  } catch (e) { next(e); }
});

// Eliminar
gruposRouter.delete('/:id', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await gruposService.eliminar(req.params.id);
    sendSuccess(res, null, 'Grupo eliminado');
  } catch (e) { next(e); }
});

// Reporte de pagos por grupo
gruposRouter.get('/:id/reporte', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fechaDesde, fechaHasta } = req.query as any;
    const result = await gruposService.reportePagos(req.params.id, fechaDesde, fechaHasta);
    sendSuccess(res, result);
  } catch (e) { next(e); }
});
