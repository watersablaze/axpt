// app/src/lib/auth/getSessionFromCookie.ts

import { jwtVerify } from 'jose';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'changeme');

type SessionData = {
  userId: string;
  tier?: string;
  displayName?: string;
};

export async function getSessionFromCookie(
  cookieJar: ReadonlyRequestCookies
): Promise<SessionData | null> {
  const token = cookieJar.get('axpt_session')?.value;
  if (!token) {
    console.warn('⚠️ No session token found in cookies.');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload !== 'object' || typeof payload.userId !== 'string') {
      console.warn('⚠️ Malformed session payload structure.');
      return null;
    }

    return {
      userId: payload.userId,
      tier: typeof payload.tier === 'string' ? payload.tier : undefined,
      displayName:
        typeof payload.displayName === 'string'
          ? payload.displayName
          : undefined,
    };
  } catch (err) {
    console.error('❌ Invalid session token (jose verify failed):', err);
    return null;
  }
}
