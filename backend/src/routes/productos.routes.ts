// ─────────────────────────────────────────────────────────────
// productos.routes.ts
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { z } from 'zod';
import { EstadoProducto } from '@prisma/client';

import { authenticate, authorize } from '../middlewares/auth.middleware';
import { productosService } from '../services/productos.service';
import { handleListar, handleObtener, handleCrear, handleActualizar, handleEliminar } from '../controllers/base.controller';

const productosRouter = Router();
productosRouter.use(authenticate);

const productoSchema = z.object({
  nombre:           z.string().min(2).max(200),
  descripcion:      z.string().optional(),
  precioVenta:      z.number().positive(),
  precioDecoracion: z.number().positive(),
  estado:           z.nativeEnum(EstadoProducto).optional(),
});

productosRouter.get('/',      (req, res, next) => handleListar(req, res, next, (p) => productosService.listar(p)));
productosRouter.post('/',     authorize('ADMINISTRADOR', 'PRODUCCION'), (req, res, next) => handleCrear(req, res, next, (d) => productosService.crear(d), productoSchema));
productosRouter.get('/:id',   (req, res, next) => handleObtener(req, res, next, (id) => productosService.obtenerPorId(id)));
productosRouter.patch('/:id', authorize('ADMINISTRADOR', 'PRODUCCION'), (req, res, next) => handleActualizar(req, res, next, (id, d) => productosService.actualizar(id, d), productoSchema.partial()));
productosRouter.delete('/:id', authorize('ADMINISTRADOR'), (req, res, next) => handleEliminar(req, res, next, (id) => productosService.eliminar(id)));

export default productosRouter;


// ─────────────────────────────────────────────────────────────
// clientes.routes.ts  (exportado al final del archivo)
// ─────────────────────────────────────────────────────────────
import { clientesService } from '../services/clientes.service';

const clientesRouter = Router();
clientesRouter.use(authenticate);

const clienteSchema = z.object({
  nombre:         z.string().min(2).max(200),
  documento:      z.string().min(3).max(20),
  direccion:      z.string().optional(),
  telefono:       z.string().optional(),
  transportadora: z.string().optional(),
});

clientesRouter.get('/',      (req, res, next) => handleListar(req, res, next, (p) => clientesService.listar(p)));
clientesRouter.post('/',     authorize('ADMINISTRADOR', 'VENTAS'), (req, res, next) => handleCrear(req, res, next, (d) => clientesService.crear(d), clienteSchema));
clientesRouter.get('/:id',   (req, res, next) => handleObtener(req, res, next, (id) => clientesService.obtenerPorId(id)));
clientesRouter.patch('/:id', authorize('ADMINISTRADOR', 'VENTAS'), (req, res, next) => handleActualizar(req, res, next, (id, d) => clientesService.actualizar(id, d), clienteSchema.partial()));
clientesRouter.delete('/:id', authorize('ADMINISTRADOR'), (req, res, next) => handleEliminar(req, res, next, (id) => clientesService.eliminar(id)));

export { clientesRouter };


// ─────────────────────────────────────────────────────────────
// pedidos.routes.ts  (exportado al final del archivo)
// ─────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { EstadoPedido } from '@prisma/client';
import { pedidosService } from '../services/pedidos.service';
import { sendSuccess, parsePagination } from '../utils/response';
import { handleObtener as hObtener } from '../controllers/base.controller';

const pedidosRouter = Router();
pedidosRouter.use(authenticate);

const pedidoSchema = z.object({
  clienteId:       z.string().uuid(),
  cantidadPedido:  z.number().int().positive(),
  cantidadPlancha: z.number().int().optional(),
  laser:           z.boolean().optional(),
  fechaInicioCorte: z.coerce.date().optional(),
  observaciones:   z.string().optional(),
});

const actualizarPedidoSchema = z.object({
  cantidadPlancha:  z.number().int().optional(),
  laser:            z.boolean().optional(),
  fechaInicioCorte: z.coerce.date().optional(),
  fechaConteo:      z.coerce.date().optional(),
  cantidadTareas:   z.number().int().optional(),
  fechaAsignacion:  z.coerce.date().optional(),
  cantidadRecibida: z.number().int().optional(),
  fechaDespacho:    z.coerce.date().optional(),
  cortes:           z.number().int().optional(),
  cantidadDespacho: z.number().int().optional(),
  observaciones:    z.string().optional(),
});

pedidosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      estado:    req.query.estado as EstadoPedido | undefined,
      clienteId: req.query.clienteId as string | undefined,
    };
    const result = await pedidosService.listar(params);
    const { sendPaginated } = await import('../utils/response');
    sendPaginated(res, result, params);
  } catch (error) { next(error); }
});

pedidosRouter.post('/', authorize('ADMINISTRADOR', 'VENTAS'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = pedidoSchema.parse(req.body);
    const data = await pedidosService.crear(dto);
    sendSuccess(res, data, 'Pedido creado exitosamente');
  } catch (error) { next(error); }
});

pedidosRouter.get('/:id',   (req, res, next) => hObtener(req, res, next, (id) => pedidosService.obtenerPorId(id)));

pedidosRouter.patch('/:id', authorize('ADMINISTRADOR', 'PRODUCCION', 'VENTAS'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = actualizarPedidoSchema.parse(req.body);
    const data = await pedidosService.actualizar(req.params.id, dto);
    sendSuccess(res, data, 'Pedido actualizado');
  } catch (error) { next(error); }
});

pedidosRouter.patch('/:id/estado', authorize('ADMINISTRADOR', 'PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = z.object({ estado: z.nativeEnum(EstadoPedido) }).parse(req.body);
    const data = await pedidosService.cambiarEstado(req.params.id, estado);
    sendSuccess(res, data, `Estado cambiado a ${estado}`);
  } catch (error) { next(error); }
});

export { pedidosRouter };
