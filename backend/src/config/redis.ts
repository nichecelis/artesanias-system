import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  keyPrefix: env.REDIS_PREFIX,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis reconectando... intento ${times}`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis: conectando...'));
redis.on('ready',   () => logger.info('Redis: listo'));
redis.on('error',   (err) => logger.error('Redis error:', err));
redis.on('close',   () => logger.warn('Redis: conexión cerrada'));

// Helpers tipados para tokens
export const redisKeys = {
  refreshToken: (userId: string, tokenId: string) => `refresh:${userId}:${tokenId}`,
  blacklistToken: (jti: string) => `blacklist:${jti}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
  resetCode: (correo: string) => `reset:${correo}`,
};
