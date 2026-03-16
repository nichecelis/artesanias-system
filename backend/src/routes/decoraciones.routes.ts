import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { decoracionesService } from '../services/decoraciones.service';
import { sendSuccess, parsePagination } from '../utils/response';

export const decoracionesRouter = Router();
decoracionesRouter.use(authenticate);

const crearSchema = z.object({
  pedidoId:      z.string().uuid(),
  decoradoraId:  z.string().uuid(),
  productoId:    z.string().uuid(),
  fechaEgreso:   z.string(),
  cantidadEgreso: z.coerce.number().int().positive(),
});

const actualizarSchema = z.object({
  fechaEgreso:     z.string().optional(),
  cantidadEgreso:  z.coerce.number().int().positive().optional(),
  fechaIngreso:    z.string().optional(),
  cantidadIngreso: z.coerce.number().int().optional(),
  arreglos:        z.coerce.number().int().optional(),
  perdidas:        z.coerce.number().int().optional(),
  compras:         z.coerce.number().optional(),
  abonosPrestamo:  z.coerce.number().optional(),
  prestamoId:      z.string().uuid().nullable().optional(),
  pagado:          z.boolean().optional(),
});

decoracionesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      decoradoraId: req.query.decoradoraId as string | undefined,
      pedidoId:     req.query.pedidoId     as string | undefined,
      pagado:       req.query.pagado !== undefined ? req.query.pagado === 'true' : undefined,
      fechaDesde:   req.query.fechaDesde   as string | undefined,
      fechaHasta:   req.query.fechaHasta   as string | undefined,
    };
    const result = await decoracionesService.listar(params);
    res.json({ success: true, data: result.items, meta: {
      total: result.total, page: params.page, limit: params.limit,
      totalPages: Math.ceil(result.total / params.limit),
    }});
  } catch (e) { next(e); }
});

decoracionesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await decoracionesService.obtenerPorId(req.params.id)); } catch (e) { next(e); }
});

decoracionesRouter.post('/', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoracionesService.crear(crearSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

decoracionesRouter.patch('/:id', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await decoracionesService.actualizar(req.params.id, actualizarSchema.parse(req.body)), 'Decoración actualizada');
  } catch (e) { next(e); }
});

decoracionesRouter.delete('/:id', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await decoracionesService.eliminar(req.params.id), 'Decoración eliminada');
  } catch (e) { next(e); }
});

decoracionesRouter.patch('/:id/pagar', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await decoracionesService.marcarPagado(req.params.id), 'Marcada como pagada');
  } catch (e) { next(e); }
});
