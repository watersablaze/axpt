// 📁 app/src/lib/security/tokenSecrets.ts

import { env } from '@/lib/env/loadEnv';
import crypto from 'crypto';

const encoder = new TextEncoder();

/**
 * Encoded key for signing JWT tokens
 */
export const SIGNING_KEY = encoder.encode(env.SIGNING_SECRET);

/**
 * AES encryption key for encrypted log
 */
export const LOG_ENCRYPTION_KEY = crypto.createSecretKey(
  new Uint8Array(
    crypto.createHash('sha256').update(env.LOG_SECRET, 'utf8').digest()
  )
);