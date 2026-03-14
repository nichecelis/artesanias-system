import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // Verificar conexión a base de datos
    await prisma.$connect();
    logger.info('✅ PostgreSQL conectado');

    // Verificar conexión a Redis
    await redis.ping();
    logger.info('✅ Redis conectado');

    // Iniciar servidor
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Servidor corriendo en http://localhost:${env.PORT}`);
      logger.info(`📚 Swagger docs: http://localhost:${env.PORT}/api/docs`);
      logger.info(`🌍 Ambiente: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} recibido. Cerrando servidor...`);
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        logger.info('Servidor cerrado limpiamente.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
