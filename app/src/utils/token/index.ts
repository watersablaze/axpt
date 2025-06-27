// ✅ FILE: app/src/utils/token/index.ts
import crypto from 'crypto';
import { getEnv } from '@/env';
import type { TokenPayload } from '@/types/token';

/**
 * Create a signed token using HMAC SHA-256
 */
export function generateSignedToken(payload: TokenPayload): string {
  const secret = getEnv('PARTNER_SECRET');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}:${signature}`;
}

/**
 * Verify a token and return its payload if valid
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, signature] = token.split(':');
    if (!payloadB64 || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', getEnv('PARTNER_SECRET'))
      .update(payloadB64)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn('❌ Token signature mismatch.');
      return null;
    }

    const decoded = Buffer.from(payloadB64, 'base64url').toString();
    const data = JSON.parse(decoded) as TokenPayload;

    if (data.exp && Date.now() > data.exp * 1000) {
      console.warn('❌ Token has expired.');
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Failed to verify token:', err);
    return null;
  }
}

/**
 * Decode the token payload without verifying the signature
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const [payloadB64] = token.split(':');
    if (!payloadB64) return null;
    const decoded = Buffer.from(payloadB64, 'base64url').toString();
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract expiration date from payload or raw token
 */
export function getTokenExpiration(token: TokenPayload | string): string | null {
  const payload = typeof token === 'string' ? decodeToken(token) : token;
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000).toLocaleString();
}