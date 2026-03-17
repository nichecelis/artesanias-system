import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

const loginSchema = z.object({
  correo:   z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export class AuthController {

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await authService.login(dto);
      sendSuccess(res, result, 'Autenticación exitosa', 200);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const tokens = await authService.refresh(refreshToken);
      sendSuccess(res, tokens, 'Token renovado', 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      await authService.logout(user.sub, user.jti, user.exp ?? 0);
      sendSuccess(res, null, 'Sesión cerrada exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthRequest).user;
      sendSuccess(res, { id: user.sub, correo: user.correo, rol: user.rol }, 'Usuario obtenido', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
