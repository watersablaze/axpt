// 📁 src/lib/token/verifyToken.ts

import { jwtVerify } from 'jose';
import { TokenPayloadSchema, TokenPayload } from './tokenSchema';
import { prisma } from '@/lib/prisma';
import { hashToken } from './utils';

const secret = new TextEncoder().encode(process.env.SIGNING_SECRET!);

export async function verifyToken(token: string): Promise<{
  valid: boolean;
  payload: TokenPayload | null;
  error?: string;
}> {
  try {
    // Step 1: Check revocation by hashed token
    const hashed = hashToken(token);
    const revoked = await prisma.revokedToken.findUnique({
      where: { rawToken: hashed },
    });

    if (revoked) {
      return {
        valid: false,
        payload: null,
        error: 'Token has been revoked.',
      };
    }

    // Step 2: Verify and validate payload
    const { payload } = await jwtVerify(token, secret);
    const validation = TokenPayloadSchema.safeParse(payload);

    if (!validation.success) {
      return {
        valid: false,
        payload: null,
        error: 'Token payload validation failed.',
      };
    }

    return {
      valid: true,
      payload: validation.data,
    };
  } catch (err: any) {
    return {
      valid: false,
      payload: null,
      error: 'Token verification failed',
    };
  }
}