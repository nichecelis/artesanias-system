import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  PORT:                    z.coerce.number().default(3001),
  API_PREFIX:              z.string().default('/api/v1'),
  DATABASE_URL:            z.string().min(1),
  JWT_SECRET:              z.string().min(32),
  JWT_EXPIRES_IN:          z.string().default('15m'),
  JWT_REFRESH_SECRET:      z.string().min(32),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('7d'),
  REDIS_URL:               z.string().default('redis://localhost:6379'),
  REDIS_PREFIX:            z.string().default('artesanias:'),
  RATE_LIMIT_WINDOW_MS:    z.coerce.number().default(900000),
  RATE_LIMIT_MAX:          z.coerce.number().default(100),
  CORS_ORIGINS:            z.string().default('http://localhost:5173'),
  BCRYPT_ROUNDS:           z.coerce.number().default(12),
  LOG_LEVEL:               z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

const defaultEnv = {
  NODE_ENV: 'test' as const,
  PORT: 3001,
  API_PREFIX: '/api/v1',
  DATABASE_URL: 'postgresql://localhost:5432/test',
  JWT_SECRET: 'test-secret-at-least-32-characters-long',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-characters',
  JWT_REFRESH_EXPIRES_IN: '7d',
  REDIS_URL: 'redis://localhost:6379',
  REDIS_PREFIX: 'artesanias:',
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX: 100,
  CORS_ORIGINS: 'http://localhost:5173',
  BCRYPT_ROUNDS: 12,
  LOG_LEVEL: 'info',
};

export const env = parsed.success ? parsed.data : defaultEnv;
export type Env = typeof defaultEnv;