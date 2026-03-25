// ─────────────────────────────────────────────────────────────
// clientes.routes.ts
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { z } from 'zod';

import { authenticate, authorize } from '../middlewares/auth.middleware';
import { clientesService } from '../services/clientes.service';
import { handleListar, handleObtener, handleCrear, handleActualizar, handleEliminar } from '../controllers/base.controller';

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
clientesRouter.post('/',     authorize('ADMINISTRADOR'), (req, res, next) => handleCrear(req, res, next, (d) => clientesService.crear(d), clienteSchema));
clientesRouter.get('/:id',   (req, res, next) => handleObtener(req, res, next, (id) => clientesService.obtenerPorId(id)));
clientesRouter.patch('/:id', authorize('ADMINISTRADOR'), (req, res, next) => handleActualizar(req, res, next, (id, d) => clientesService.actualizar(id, d), clienteSchema.partial()));
clientesRouter.delete('/:id', authorize('ADMINISTRADOR'), (req, res, next) => handleEliminar(req, res, next, (id) => clientesService.eliminar(id)));

export default clientesRouter;