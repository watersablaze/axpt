// 📁 src/lib/token/signToken.ts

import { env } from '@/lib/env/readEnv';
import { SignJWT } from 'jose';
import type { TokenPayload } from '@/types/token';

export async function signToken(payload: TokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.SIGNING_SECRET);

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : now + 60 * 60 * 24 * 7;

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(payload.iat || now)
    .setExpirationTime(exp)
    .sign(secret);
}