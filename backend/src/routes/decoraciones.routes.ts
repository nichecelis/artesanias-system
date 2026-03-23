import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { decoracionesService } from '../services/decoraciones.service';
import { sendSuccess, parsePagination } from '../utils/response';

export const decoracionesRouter = Router();
decoracionesRouter.use(authenticate);

const uuidOpcional = z.union([z.string().uuid(), z.literal(''), z.null()]).transform(v => v === '' ? null : v).optional();

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
  prestamoId:      uuidOpcional,
  pagado:          z.boolean().optional(),
});

decoracionesRouter.get('/reporte-por-grupo', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      grupoId:       req.query.grupoId       as string | undefined,
      decoradoraId:  req.query.decoradoraId  as string | undefined,
      fechaDesde:    req.query.fechaDesde    as string | undefined,
      fechaHasta:    req.query.fechaHasta    as string | undefined,
      search:        req.query.search        as string | undefined,
      incluirPagadas: req.query.incluirPagadas === 'true',
    };
    const result = await decoracionesService.reportePorGrupo(params);
    sendSuccess(res, result);
  } catch (e) { next(e); }
});

decoracionesRouter.get('/', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      decoradoraId: req.query.decoradoraId as string | undefined,
      pedidoId:     req.query.pedidoId     as string | undefined,
      pagado:       req.query.pagado !== undefined ? req.query.pagado === 'true' : undefined,
      fechaDesde:   req.query.fechaDesde   as string | undefined,
      fechaHasta:   req.query.fechaHasta   as string | undefined,
    };

    if (req.query.agrupado === 'true') {
      const result = await decoracionesService.listarAgrupado(params);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: 1, limit: 1000, totalPages: 1 }});
    } else {
      const result = await decoracionesService.listar(params);
      res.json({ success: true, data: result.items, meta: {
        total: result.total, page: params.page, limit: params.limit,
        totalPages: Math.ceil(result.total / params.limit),
      }});
    }
  } catch (e) { next(e); }
});

decoracionesRouter.get('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await decoracionesService.obtenerPorId(req.params.id)); } catch (e) { next(e); }
});

decoracionesRouter.post('/', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await decoracionesService.crear(crearSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

decoracionesRouter.patch('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await decoracionesService.actualizar(req.params.id, actualizarSchema.parse(req.body)), 'Decoración actualizada');
  } catch (e) { next(e); }
});

decoracionesRouter.delete('/:id', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await decoracionesService.eliminar(req.params.id), 'Decoración eliminada');
  } catch (e) { next(e); }
});

decoracionesRouter.patch('/:id/pagar', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await decoracionesService.marcarPagado(req.params.id), 'Marcada como pagada');
  } catch (e) { next(e); }
});

const pagarMasivoSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos una decoración'),
});

decoracionesRouter.post('/pagar-masivo', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = pagarMasivoSchema.parse(req.body);
    const result = await decoracionesService.pagarDecoraciones(ids);
    sendSuccess(res, result, `${result.decoracionesPagadas.length} decoración(es) marcada(s) como pagada(s)`);
  } catch (e) { next(e); }
});
