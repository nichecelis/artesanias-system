import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV === 'development') {
  // Log de queries en desarrollo
  (prisma as any).$on('query', (e: any) => {
    logger.debug(`Prisma Query: ${e.query} — ${e.duration}ms`);
  });
}

(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
