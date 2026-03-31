"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const swagger_1 = require("./config/swagger");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const requestLogger_1 = require("./middlewares/requestLogger");
const logger_1 = require("./utils/logger");
// Rutas
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const usuarios_routes_1 = __importDefault(require("./routes/usuarios.routes"));
const productos_routes_1 = __importDefault(require("./routes/productos.routes"));
const clientes_routes_1 = __importDefault(require("./routes/clientes.routes"));
const pedidos_routes_1 = __importDefault(require("./routes/pedidos.routes"));
const reportes_routes_1 = __importDefault(require("./routes/reportes.routes"));
const precios_routes_1 = __importDefault(require("./routes/precios.routes"));
const decoradoras_routes_1 = require("./routes/decoradoras.routes");
const grupos_routes_1 = require("./routes/grupos.routes");
const decoraciones_routes_1 = require("./routes/decoraciones.routes");
const prestamos_routes_1 = require("./routes/prestamos.routes");
const nomina_routes_1 = require("./routes/nomina.routes");
const facturas_routes_1 = require("./routes/facturas.routes");
const despachos_routes_1 = __importDefault(require("./routes/despachos.routes"));
const parametrizacion_routes_1 = require("./routes/parametrizacion.routes");
const app = (0, express_1.default)();
// ─── Seguridad OWASP ─────────────────────────────────────────
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── Middlewares base ─────────────────────────────────────────
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('combined', { stream: { write: (msg) => logger_1.logger.http(msg.trim()) } }));
app.use(requestLogger_1.requestLogger);
app.use(rateLimiter_1.rateLimiter);
// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── Swagger docs ─────────────────────────────────────────────
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// ─── Rutas de la API ──────────────────────────────────────────
const API = env_1.env.API_PREFIX;
app.use(`${API}/auth`, auth_routes_1.default);
app.use(`${API}/usuarios`, usuarios_routes_1.default);
app.use(`${API}/productos`, productos_routes_1.default);
app.use(`${API}/clientes`, clientes_routes_1.default);
app.use(`${API}/pedidos`, pedidos_routes_1.default);
app.use(`${API}/decoradoras`, decoradoras_routes_1.decoradorasRouter);
app.use(`${API}/decoraciones`, decoraciones_routes_1.decoracionesRouter);
app.use(`${API}/prestamos`, prestamos_routes_1.prestamosRouter);
app.use(`${API}/empleados`, decoradoras_routes_1.empleadosRouter);
app.use(`${API}/nomina`, nomina_routes_1.nominaRouter);
app.use(`${API}/reportes`, reportes_routes_1.default);
app.use(`${API}/grupos`, grupos_routes_1.gruposRouter);
app.use(`${API}/precios`, precios_routes_1.default);
app.use(`${API}/facturas`, facturas_routes_1.facturasRouter);
app.use(`${API}/despachos`, despachos_routes_1.default);
app.use(`${API}/parametrizacion`, parametrizacion_routes_1.parametrizacionRouter);
// ─── Manejo de errores ────────────────────────────────────────
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map