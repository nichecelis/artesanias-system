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
  try { 
    const data = await productoClientesService.listarPorProducto(req.params.productoId);
    // Agregamos el mensaje "Precios del producto" como tercer argumento
    sendSuccess(res, data, 'Precios del producto'); 
  } catch (e) { next(e); }
});

// Precios de un cliente
productoClientesRouter.get('/cliente/:clienteId', async (req: Request, res: Response, next: NextFunction) => {
  try { 
    const data = await productoClientesService.listarPorCliente(req.params.clienteId);
    // Agregamos el mensaje "Precios del cliente"
    sendSuccess(res, data, 'Precios del cliente'); 
  } catch (e) { next(e); }
});

// Crear/actualizar precio
productoClientesRouter.put('/:clienteId/:productoId', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { precioVenta } = precioSchema.parse(req.body);
    // Usar el nombre exacto del modelo: productoCliente (camelCase)
    const data = await productoClientesService.upsert(
      req.params.productoId, 
      req.params.clienteId, 
      precioVenta
    );
    res.status(200).json({ success: true, data });
  } catch (e) { next(e); }
});

// Eliminar precio
productoClientesRouter.delete('/:productoId/:clienteId', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await productoClientesService.eliminar(req.params.productoId, req.params.clienteId), 'Precio eliminado');
  } catch (e) { next(e); }
});
