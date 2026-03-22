import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { despachosService } from '../services/despachos.service';
import { sendSuccess, parsePagination } from '../utils/response';
import { AppError } from '../types';

const despachosRouter = Router();
despachosRouter.use(authenticate);

const fechaOpcional = z.string().optional().transform(v => v === '' ? undefined : v);
const numOpcional = z.coerce.number().int().optional().transform(v => v === 0 ? undefined : v);

const registrarDespachoSchema = z.object({
  caja1Fecha: fechaOpcional,
  caja1Cantidad: numOpcional,
  caja2Fecha: fechaOpcional,
  caja2Cantidad: numOpcional,
  caja3Fecha: fechaOpcional,
  caja3Cantidad: numOpcional,
});

despachosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parsePagination(req.query as any);
    const search = req.query.search as string;
    const clienteId = req.query.clienteId as string;
    const estado = req.query.estado as string;
    const result = await despachosService.listar({ 
      page: params.page,
      limit: params.limit,
      search, 
      clienteId, 
      estado 
    });
    sendSuccess(res, result);
  } catch (e) { next(e); }
});

despachosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await despachosService.obtenerPorId(req.params.id);
    sendSuccess(res, result);
  } catch (e) { next(e); }
});

despachosRouter.patch('/:id/despachar', 
  authorize('ADMINISTRADOR', 'PRODUCCION', 'VENTAS'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = registrarDespachoSchema.parse(req.body);
      const result = await despachosService.registrarDespacho(id, dto);
      sendSuccess(res, result, 'Despacho registrado exitosamente');
    } catch (e) {
      if (e instanceof z.ZodError) throw new AppError(e.errors[0]?.message || 'Datos inválidos', 400);
      next(e);
    }
  }
);

export default despachosRouter;
