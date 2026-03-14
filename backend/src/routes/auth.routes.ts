import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, password]
 *             properties:
 *               correo:   { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Autenticación exitosa, devuelve par de tokens
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login',   authRateLimiter, authController.login.bind(authController));
router.post('/refresh',               authController.refresh.bind(authController));
router.post('/logout',  authenticate,   authController.logout.bind(authController));
router.get('/me',       authenticate,   authController.me.bind(authController));

export default router;
