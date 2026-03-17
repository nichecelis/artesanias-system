"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = (0, express_1.Router)();
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
router.post('/login', rateLimiter_1.authRateLimiter, auth_controller_1.authController.login.bind(auth_controller_1.authController));
router.post('/refresh', auth_controller_1.authController.refresh.bind(auth_controller_1.authController));
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.authController.logout.bind(auth_controller_1.authController));
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.authController.me.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map