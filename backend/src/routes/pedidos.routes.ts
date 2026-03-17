import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoPedido } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { pedidosService } from '../services/pedidos.service';
import { sendSuccess, parsePagination } from '../utils/response';

const pedidosRouter = Router();
pedidosRouter.use(authenticate);

const productoItemSchema = z.object({
  productoId:      z.string().uuid(),
  cantidadPedido:  z.coerce.number().int().positive(),
  cantidadPlancha: z.coerce.number().int().optional(),
});

const fechaOpcional = z.string().optional().transform(v => v === '' ? undefined : v);
const numOpcional   = z.coerce.number().int().optional().transform(v => v === 0 ? undefined : v);

const crearPedidoSchema = z.object({
  clienteId:        z.string().uuid(),
  laser:            z.boolean().optional(),
  fechaInicioCorte: fechaOpcional,
  observaciones:    z.string().optional().transform(v => v === '' ? undefined : v),
  productos:        z.array(productoItemSchema).min(1, 'Al menos un producto'),
});

const actualizarPedidoSchema = z.object({
  laser:            z.boolean().optional(),
  fechaInicioCorte: fechaOpcional,
  fechaConteo:      fechaOpcional,
  cantidadTareas:   numOpcional,
  fechaAsignacion:  fechaOpcional,
  cantidadRecibida: numOpcional,
  fechaDespacho:    fechaOpcional,
  cortes:           numOpcional,
  cantidadDespacho: numOpcional,
  cantidadFaltante: numOpcional,
  estado:           z.nativeEnum(EstadoPedido).optional(),
  observaciones:    z.string().optional().transform(v => v === '' ? undefined : v),
  productos:        z.array(productoItemSchema).optional(),
});

pedidosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      estado: req.query.estado as EstadoPedido,
      search: req.query.search as string,
      fechaDesde: req.query.fechaDesde as string, // Asegúrate de pasar esto
      fechaHasta: req.query.fechaHasta as string, // Asegúrate de pasar esto
    };
    
    const result = await pedidosService.listar(params);
    
    // Sincronizado con la respuesta del servicio anterior
    res.json({
      success: true,
      data: result.data,  // ✓ Correct
      meta: result.meta   // ✓ Correct
      });
  } catch (e) { next(e); }
});

pedidosRouter.get('/stats/resumen', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await pedidosService.estadisticas()); } catch (e) { next(e); }
});

pedidosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await pedidosService.obtenerPorId(req.params.id)); } catch (e) { next(e); }
});

pedidosRouter.post('/', authorize('ADMINISTRADOR','VENTAS','PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pedidosService.crear(crearPedidoSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

pedidosRouter.patch('/:id', authorize('ADMINISTRADOR','VENTAS','PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await pedidosService.actualizar(req.params.id, actualizarPedidoSchema.parse(req.body)), 'Pedido actualizado');
  } catch (e) { next(e); }
});

pedidosRouter.patch('/:id/estado', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = z.object({ estado: z.nativeEnum(EstadoPedido) }).parse(req.body);
    sendSuccess(res, await pedidosService.cambiarEstado(req.params.id, estado), 'Estado actualizado');
  } catch (e) { next(e); }
});

export { pedidosRouter };
export default pedidosRouter;
