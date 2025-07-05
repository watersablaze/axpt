// ✅ FILE: app/src/utils/token/index.ts

import crypto from 'crypto';
import base64url from 'base64url';
import { getEnv } from '@/env';
import type { TokenPayload } from '@/types/token';

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generates a signed AXPT-style token: base64Payload:signature
 */
export function generateSignedToken(payload: TokenPayload): string {
  const secret = getEnv('PARTNER_SECRET');

  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
  };

  const payloadB64 = base64url.encode(JSON.stringify(fullPayload));
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}:${signature}`;
}

/**
 * Verifies AXPT-style token integrity and expiration.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, signature] = token.split(':');
    if (!payloadB64 || !signature) {
      console.warn('❌ Malformed token structure.');
      return null;
    }

    const expectedSig = crypto
      .createHmac('sha256', getEnv('PARTNER_SECRET'))
      .update(payloadB64)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn('❌ Token signature mismatch.');
      return null;
    }

    const decoded = base64url.decode(payloadB64);
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
 * Decodes the payload of an AXPT-style token without verifying it.
 */
export function decodeToken(rawToken: string): TokenPayload | null {
  try {
    const [base64Payload] = rawToken.split(':');
    if (!base64Payload) {
      console.warn('[AXPT] ⚠️ Missing base64 payload segment in token.');
      return null;
    }

    const json = base64url.decode(base64Payload);
    const payload = JSON.parse(json);

    // Structural validation
    if (!payload.partner || !payload.tier || !Array.isArray(payload.docs)) {
      console.warn('[AXPT] ⚠️ Token payload missing required fields.');
      return null;
    }

    return payload as TokenPayload;
  } catch (err) {
    console.error('[AXPT] ❌ Failed to decode token:', err);
    return null;
  }
}

/**
 * Checks if a decoded token is expired based on issued time.
 */
export function isTokenExpired(iat: number, ttlSeconds = 3600): boolean {
  const now = Math.floor(Date.now() / 1000);
  const expired = now > iat + ttlSeconds;
  if (expired) {
    console.warn(`[AXPT] ⏳ Token expired: issued at ${iat}, now ${now}`);
  }
  return expired;
}