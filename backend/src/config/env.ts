import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
  PORT:                    z.coerce.number().default(3000),
  API_PREFIX:              z.string().default('/api/v1'),
  DATABASE_URL:            z.string().url(),
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
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
