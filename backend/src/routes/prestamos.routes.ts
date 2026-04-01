import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { prestamosService } from '../services/prestamos.service';
import { sendSuccess, parsePagination } from '../utils/response';

export const prestamosRouter = Router();
prestamosRouter.use(authenticate);

const crearSchema = z.object({
  tipo:           z.enum(['DECORADORA', 'EMPLEADO']),
  beneficiarioId: z.string().min(1),
  monto:          z.coerce.number().positive(),
  fecha:          z.string(),
  cuotas:      z.coerce.number().int().positive().optional(),
  observacion:    z.string().optional(),
});

const abonoSchema = z.object({
  monto: z.coerce.number().positive(),
  fecha: z.string(),
});

prestamosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      tipo:          req.query.tipo         as any,
      decoradoraId:  req.query.decoradoraId as string | undefined,
      empleadoId:    req.query.empleadoId   as string | undefined,
      soloConSaldo:  req.query.soloConSaldo === 'true',
      activo:        req.query.activo as boolean | string | undefined,
    };
    const result = await prestamosService.listar(params);
    res.json({ success: true, data: result.items, meta: {
      total: result.total, page: params.page, limit: params.limit,
      totalPages: Math.ceil(result.total / params.limit),
    }});
  } catch (e) { next(e); }
});

prestamosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await prestamosService.obtenerPorId(req.params.id)); } catch (e) { next(e); }
});

prestamosRouter.post('/', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prestamosService.crear(crearSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

prestamosRouter.post('/:id/abonos', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { monto, fecha } = abonoSchema.parse(req.body);
    sendSuccess(res, await prestamosService.abonar(req.params.id, monto, fecha), 'Abono registrado');
  } catch (e) { next(e); }
});

prestamosRouter.delete('/abonos/:abonoId', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await prestamosService.eliminarAbono(req.params.abonoId), 'Abono eliminado');
  } catch (e) { next(e); }
});

prestamosRouter.delete('/:id', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await prestamosService.eliminar(req.params.id), 'Préstamo eliminado');
  } catch (e) { next(e); }
});

prestamosRouter.patch('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { archivoFirmado } = req.body;
    sendSuccess(res, await prestamosService.actualizarArchivo(req.params.id, archivoFirmado), 'Archivo actualizado');
  } catch (e) { next(e); }
});
