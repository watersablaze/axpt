import crypto from 'crypto';
import base64url from 'base64url';
import { getEnv } from '@/env';
import { TokenPayload } from '@/types/token';

export const runtime = 'nodejs';

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

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