import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { facturasService } from '../services/facturas.service';
import { sendSuccess, parsePagination } from '../utils/response';
import { AppError } from '../types';

export const facturasRouter = Router();
facturasRouter.use(authenticate);

const facturaItemSchema = z.object({
  pedidoProductoId: z.string().uuid(),
  cantidad: z.coerce.number().int().positive(),
  precioUnitario: z.coerce.number().positive(),
  descuento: z.coerce.number().min(0).optional(),
});

const crearFacturaSchema = z.object({
  clienteId: z.string().uuid(),
  fecha: z.string(),
  descuento: z.coerce.number().min(0).optional(),
  abonos: z.coerce.number().min(0).optional(),
  saldoAnterior: z.coerce.number().min(0).optional(),
  observaciones: z.string().optional(),
  items: z.array(facturaItemSchema).min(1, 'Debe incluir al menos un producto'),
});

facturasRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parsePagination(req.query as any);
    const result = await facturasService.listar({
      page: params.page,
      limit: params.limit,
      search: params.search,
      clienteId: req.query.clienteId as string,
      fechaDesde: req.query.fechaDesde as string,
      fechaHasta: req.query.fechaHasta as string,
    });
    res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (e) { next(e); }
});

facturasRouter.get('/cliente/:clienteId/pedidos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pedidos = await facturasService.obtenerPedidosDisponibles(req.params.clienteId);
    sendSuccess(res, pedidos);
  } catch (e) { next(e); }
});

facturasRouter.get('/cliente/:clienteId/saldo-anterior', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saldo = await facturasService.obtenerSaldoAnterior(req.params.clienteId, req.query.excluir as string);
    sendSuccess(res, { saldoAnterior: saldo });
  } catch (e) { next(e); }
});

facturasRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factura = await facturasService.obtenerPorId(req.params.id);
    sendSuccess(res, factura);
  } catch (e) { next(e); }
});

facturasRouter.post('/', authorize('ADMINISTRADOR', 'CONTABILIDAD', 'VENTAS'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = crearFacturaSchema.parse(req.body);
    const factura = await facturasService.crear(dto);
    sendSuccess(res, factura, 'Factura creada exitosamente', 201);
  } catch (e) { next(e); }
});

facturasRouter.patch('/:id', authorize('ADMINISTRADOR', 'CONTABILIDAD'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const factura = await facturasService.actualizar(req.params.id, req.body);
    sendSuccess(res, factura, 'Factura actualizada');
  } catch (e) { next(e); }
});

facturasRouter.delete('/:id', authorize('ADMINISTRADOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await facturasService.eliminar(req.params.id);
    sendSuccess(res, null, 'Factura eliminada');
  } catch (e) { next(e); }
});
