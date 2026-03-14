import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { productoClientesService } from '../services/producto-clientes.service';
import { sendSuccess } from '../utils/response';

export const productoClientesRouter = Router();
productoClientesRouter.use(authenticate);

const precioSchema = z.object({ precioVenta: z.number().positive() });

// Precios de un producto
productoClientesRouter.get('/producto/:productoId', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await productoClientesService.listarPorProducto(req.params.productoId)); } catch (e) { next(e); }
});

// Precios de un cliente
productoClientesRouter.get('/cliente/:clienteId', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await productoClientesService.listarPorCliente(req.params.clienteId)); } catch (e) { next(e); }
});

// Crear/actualizar precio
productoClientesRouter.put('/:productoId/:clienteId', authorize('ADMINISTRADOR', 'VENTAS'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { precioVenta } = precioSchema.parse(req.body);
    const data = await productoClientesService.upsert(req.params.productoId, req.params.clienteId, precioVenta);
    res.status(200).json({ success: true, data });
  } catch (e) { next(e); }
});

// Eliminar precio
productoClientesRouter.delete('/:productoId/:clienteId', authorize('ADMINISTRADOR', 'VENTAS'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await productoClientesService.eliminar(req.params.productoId, req.params.clienteId), 'Precio eliminado');
  } catch (e) { next(e); }
});
