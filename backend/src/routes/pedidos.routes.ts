import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EstadoPedido } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { pedidosService } from '../services/pedidos.service';
import { sendSuccess, parsePagination } from '../utils/response';
import { AppError } from '../types';

const pedidosRouter = Router();
pedidosRouter.use(authenticate);

const fechaOpcional = z.string().optional().transform(v => v === '' ? undefined : v);
const numOpcional   = z.coerce.number().int().optional().transform(v => v === 0 ? undefined : v);

const productoItemSchema = z.object({
  productoId:       z.string().uuid(),
  cantidadPedido:   z.coerce.number().int().positive(),
  cantidadPlancha:  z.coerce.number().int().optional(),
  estado:           z.nativeEnum(EstadoPedido).optional(),
  fechaInicioCorte: fechaOpcional,
  fechaDespacho:    fechaOpcional,
  cantidadRecibida: numOpcional,
});

const crearPedidoSchema = z.object({
  clienteId:        z.string().uuid(),
  laser:            z.enum(['TALLER', 'EXTERNO']).optional(),
  fechaInicioCorte: fechaOpcional,
  observaciones:    z.string().optional().transform(v => v === '' ? undefined : v),
  productos:        z.array(productoItemSchema).min(1, 'Al menos un producto'),
});

const actualizarPedidoSchema = z.object({
  laser:            z.enum(['TALLER', 'EXTERNO']).optional(),
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

pedidosRouter.get('/stats/resumen', async (req: Request, res: Response, next: NextFunction) => {
  try { 
    const stats = await pedidosService.estadisticas();
    res.json({ success: true, data: stats });
  } catch (e) { next(e); }
});

// ✅ GET /pedidos/:id - Obtener por ID (dinámica, va AL FINAL)
pedidosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validación manual si no usas Zod en el middleware
    if (req.params.id.length < 30) { // Un UUID tiene 36 caracteres
       throw new AppError('ID de pedido inválido', 400);
    }
    
    const pedido = await pedidosService.obtenerPorId(req.params.id);
    res.json({ success: true, data: pedido });
  } catch (e) { next(e); }
});

// ✅ GET /pedidos - Listar con paginación
pedidosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      ...parsePagination(req.query as any),
      estado: req.query.estado as any,
      search: req.query.search as string,
      fechaDesde: req.query.fechaDesde as string,
      fechaHasta: req.query.fechaHasta as string,
    };
    
    const result = await pedidosService.listar(params);
    sendSuccess(res, result.data, 'Pedidos obtenidos correctamente', 200);
  } catch (e) { 
    next(e); 
  }
});

// ✅ POST /pedidos - Crear
pedidosRouter.post('/', authorize('ADMINISTRADOR','VENTAS','PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pedidosService.crear(crearPedidoSchema.parse(req.body));
    sendSuccess(res, data, 'Pedido creado exitosamente', 201);
  } catch (e) { 
    next(e); 
  }
});


// ✅ PATCH /pedidos/:id/estado - Cambiar estado
pedidosRouter.patch('/:id/estado', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { estado } = z.object({ estado: z.nativeEnum(EstadoPedido) }).parse(req.body);
    const data = await pedidosService.cambiarEstado(req.params.id, estado);
    sendSuccess(res, data, 'Estado actualizado correctamente', 200);
  } catch (e) { 
    next(e); 
  }
});

// ✅ PATCH /pedidos/:id - Actualizar
pedidosRouter.patch('/:id', authorize('ADMINISTRADOR','VENTAS','PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pedidosService.actualizar(req.params.id, actualizarPedidoSchema.parse(req.body));
    sendSuccess(res, data, 'Pedido actualizado correctamente', 200);
  } catch (e) { 
    next(e); 
  }
});

// ✅ PATCH /pedidos/producto/:pedidoProductoId - Actualizar seguimiento
pedidosRouter.patch('/producto/:pedidoProductoId', authorize('ADMINISTRADOR','PRODUCCION'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await pedidosService.actualizarSeguimientoProducto(req.params.pedidoProductoId, req.body);
    sendSuccess(res, data, 'Seguimiento de producto actualizado correctamente', 200);
  } catch (e) { 
    next(e); 
  }
});

export { pedidosRouter };
export default pedidosRouter;
