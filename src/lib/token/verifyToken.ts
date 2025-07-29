// 📁 src/lib/token/verifyToken.ts

import { jwtVerify } from 'jose';
import { TokenPayloadSchema, type TokenPayload } from './tokenSchema';

if (!process.env.SIGNING_SECRET) {
  throw new Error('SIGNING_SECRET is not set in environment');
}
const secret = new TextEncoder().encode(process.env.SIGNING_SECRET);

type TokenVerificationResult =
  | { valid: true; payload: TokenPayload }
  | { valid: false; payload: null; error: string };

export async function verifyToken(token: string): Promise<TokenVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, secret);

    const validation = TokenPayloadSchema.safeParse(payload);
    if (!validation.success) {
      console.warn('[verifyToken] ❌ Payload schema invalid:', validation.error.format());
      return {
        valid: false,
        payload: null,
        error: 'Invalid token payload schema',
      };
    }

    return {
      valid: true,
      payload: validation.data,
    };
  } catch (err: any) {
    console.warn('[verifyToken] ❌ JWT verification failed:', err);
    return {
      valid: false,
      payload: null,
      error: 'JWT signature verification failed',
    };
  }
}