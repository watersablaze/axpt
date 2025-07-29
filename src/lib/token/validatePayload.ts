// 📁 src/lib/token/validatePayload.ts

import { TokenPayloadSafeSchema } from './tokenSchema';
import type { TokenPayload } from './tokenSchema';

/**
 * Validates and normalizes token payload.
 * - Checks schema compliance
 * - Checks expiry (exp vs now)
 */
export function validateTokenPayload(payload: unknown): {
  valid: boolean;
  data?: TokenPayload;
  error?: string;
} {
  const parsed = TokenPayloadSafeSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      valid: false,
      error: 'Schema validation failed',
    };
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.data.exp && parsed.data.exp < now) {
    return {
      valid: false,
      error: 'Token has expired',
    };
  }

  return {
    valid: true,
    data: parsed.data,
  };
}