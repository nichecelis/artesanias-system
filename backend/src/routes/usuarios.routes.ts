import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Rol } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { usuariosService } from '../services/usuarios.service';
import { sendSuccess, parsePagination } from '../utils/response';

const usuariosRouter = Router();
usuariosRouter.use(authenticate, authorize('ADMINISTRADOR'));

const crearSchema = z.object({
  nombre:   z.string().min(2).max(200),
  correo:   z.string().email(),
  password: z.string().min(6),
  rol:      z.nativeEnum(Rol),
});

const actualizarSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  correo: z.string().email().optional(),
  rol:    z.nativeEnum(Rol).optional(),
  activo: z.boolean().optional(),
});

usuariosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parsePagination(req.query as any);
    const result = await usuariosService.listar(params);
    res.json({ success: true, data: result.items, meta: {
      total: result.total, page: params.page, limit: params.limit,
      totalPages: Math.ceil(result.total / params.limit),
    }});
  } catch (e) { next(e); }
});

usuariosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await usuariosService.obtenerPorId(req.params.id)); } catch (e) { next(e); }
});

usuariosRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await usuariosService.crear(crearSchema.parse(req.body));
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

usuariosRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await usuariosService.actualizar(req.params.id, actualizarSchema.parse(req.body)), 'Usuario actualizado');
  } catch (e) { next(e); }
});

usuariosRouter.patch('/:id/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
    sendSuccess(res, await usuariosService.cambiarPassword(req.params.id, password), 'Contraseña actualizada');
  } catch (e) { next(e); }
});

usuariosRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await usuariosService.eliminar(req.params.id), 'Usuario desactivado');
  } catch (e) { next(e); }
});

export { usuariosRouter };
export default usuariosRouter;
