"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    try {
        // Verificar conexión a base de datos
        await database_1.prisma.$connect();
        logger_1.logger.info('✅ PostgreSQL conectado');
        // Verificar conexión a Redis
        await redis_1.redis.ping();
        logger_1.logger.info('✅ Redis conectado');
        // Iniciar servidor
        const server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 Servidor corriendo en http://localhost:${env_1.env.PORT}`);
            logger_1.logger.info(`📚 Swagger docs: http://localhost:${env_1.env.PORT}/api/docs`);
            logger_1.logger.info(`🌍 Ambiente: ${env_1.env.NODE_ENV}`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`${signal} recibido. Cerrando servidor...`);
            server.close(async () => {
                await database_1.prisma.$disconnect();
                redis_1.redis.disconnect();
                logger_1.logger.info('Servidor cerrado limpiamente.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map