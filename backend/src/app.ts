import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { rateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { requestLogger } from './middlewares/requestLogger';
import { logger } from './utils/logger';

// Rutas
import authRoutes      from './routes/auth.routes';
import usuariosRoutes  from './routes/usuarios.routes';
import productosRoutes from './routes/productos.routes';
import clientesRoutes  from './routes/clientes.routes';
import pedidosRoutes   from './routes/pedidos.routes';
import reportesRoutes  from './routes/reportes.routes';
import preciosRoutes from './routes/precios.routes';

import {
  decoradorasRouter  as decoradorasRoutes,
  empleadosRouter    as empleadosRoutes,
} from './routes/decoradoras.routes';
import { gruposRouter as gruposRoutes } from './routes/grupos.routes';
import { decoracionesRouter as decoracionesRoutes } from './routes/decoraciones.routes';
import { prestamosRouter as prestamosRoutes } from './routes/prestamos.routes';
import { nominaRouter as nominaRoutes } from './routes/nomina.routes';

const app = express();

// ─── Seguridad OWASP ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ─── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Middlewares base ─────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use(requestLogger);
app.use(rateLimiter);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Swagger docs ─────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Rutas de la API ──────────────────────────────────────────
const API = env.API_PREFIX;

app.use(`${API}/auth`,         authRoutes);
app.use(`${API}/usuarios`,     usuariosRoutes);
app.use(`${API}/productos`,    productosRoutes);
app.use(`${API}/clientes`,     clientesRoutes);
app.use(`${API}/pedidos`,      pedidosRoutes);
app.use(`${API}/decoradoras`,  decoradorasRoutes);
app.use(`${API}/decoraciones`, decoracionesRoutes);
app.use(`${API}/prestamos`,    prestamosRoutes);
app.use(`${API}/empleados`,    empleadosRoutes);
app.use(`${API}/nomina`,       nominaRoutes);
app.use(`${API}/reportes`,     reportesRoutes);
app.use(`${API}/grupos`,      gruposRoutes);
app.use(`${API}/precios`, preciosRoutes);

// ─── Manejo de errores ────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
