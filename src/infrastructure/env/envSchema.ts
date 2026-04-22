// 📁 app/src/lib/env/envSchema.ts

import { z } from 'zod';

export const envSchema = z.object({
  SIGNING_SECRET: z.string().min(32, 'SIGNING_SECRET must be at least 32 characters'),
  LOG_SECRET: z.string().min(16, 'LOG_SECRET must be at least 16 characters'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});