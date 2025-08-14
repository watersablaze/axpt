'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { SessionPayload } from '@/types/auth';
import { SESSION_COOKIE_NAME } from '@/constants/cookies';
import { SIGNING_SECRET } from '@/lib/env/secrets';

export async function getTokenPayloadFromCookieOnly(): Promise<SessionPayload | null> {
  const cookieStore = await cookies(); // ✅ FIXED
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SIGNING_SECRET);
    return {
      userId: payload.userId as string,
      tier: payload.tier as SessionPayload['tier'],
      displayName: payload.displayName as string,
      popupMessage: payload.popupMessage as string,
      greeting: payload.greeting as string,
      email: payload.email as string,
      partner: payload.partner as string,
      docs: payload.docs as SessionPayload['docs'],
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (err) {
    console.warn('Invalid session cookie payload');
    return null;
  }
}