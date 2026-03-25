import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { parametrizacionService } from '../services/parametrizacion.service';
import { sendSuccess } from '../utils/response';

export const parametrizacionRouter = Router();
parametrizacionRouter.use(authenticate);

parametrizacionRouter.get('/', async (req, res, next) => {
  try {
    const config = await parametrizacionService.obtener();
    sendSuccess(res, config);
  } catch (e) { next(e); }
});

parametrizacionRouter.patch('/', authorize('ADMINISTRADOR'), async (req, res, next) => {
  try {
    const { nombre, nit, direccion, telefono, logo } = req.body;
    const config = await parametrizacionService.actualizar({ nombre, nit, direccion, telefono, logo });
    sendSuccess(res, config, 'Configuración actualizada');
  } catch (e) { next(e); }
});