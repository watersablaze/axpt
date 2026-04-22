import { env } from '@/infrastructure/env/loadEnv';

export const SIGNING_SECRET = new TextEncoder().encode(env.SIGNING_SECRET || '');