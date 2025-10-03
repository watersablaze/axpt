import { jwtVerify } from 'jose';
import { TokenPayloadSchema, type TokenPayload } from './tokenSchema';
import { prisma } from '@/lib/prisma';
// import { hashToken } from './utils'; // not used if we compare raw

function toUint8(secretRaw: string) {
  try {
    const b64 = secretRaw.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Uint8Array(bytes);
  } catch {
    return new TextEncoder().encode(secretRaw);
  }
}

const secretStr =
  process.env.SIGNING_SECRET ??
  process.env.SESSION_SECRET ??   // fallback to your env
  process.env.JWT_SECRET;

if (!secretStr) {
  throw new Error('Missing SIGNING_SECRET/SESSION_SECRET/JWT_SECRET');
}

const secret = toUint8(secretStr.trim()); // ← trim whitespace

export async function verifyToken(token: string): Promise<{
  valid: boolean;
  payload: TokenPayload | null;
  error?: string;
}> {
  try {
    // 1) Verify signature (HS256) with a little clock tolerance; no iss/aud constraint
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      clockTolerance: 60,
    });

    // 2) Shape validation
    const v = TokenPayloadSchema.safeParse(payload);
    if (!v.success) {
      return { valid: false, payload: null, error: 'Token payload validation failed.' };
    }

    // 3) Revocation check — your Prisma model stores RAW token in `rawToken`
    const revoked = await prisma.revokedToken.findUnique({
      where: { rawToken: token },
    });
    if (revoked) {
      return { valid: false, payload: null, error: 'Token has been revoked.' };
    }

    return { valid: true, payload: v.data };
  } catch (err: any) {
    // Helpful diagnostics
    console.warn('[verifyToken] jose error:', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
    });
    return { valid: false, payload: null, error: 'Token verification failed' };
  }
}