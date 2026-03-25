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