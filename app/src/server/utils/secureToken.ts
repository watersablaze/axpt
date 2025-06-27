// app/src/server/utils/secureToken.ts

import crypto from 'node:crypto';

/**
 * Generates a secure random token and returns both the raw and hashed version.
 * @returns { raw: string, hash: string }
 */
export function generateSecureToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex'); // 64-character hex string
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Hashes any provided token string using SHA-256.
 * @param token - Raw token to hash
 * @returns SHA-256 hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}