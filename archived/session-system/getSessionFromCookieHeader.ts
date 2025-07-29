// 📁 app/src/lib/auth/getSessionFromCookieHeader.ts

import { decodeSessionToken } from '@/lib/auth/session';
import { SESSION_COOKIE_NAME } from '@/constants/cookies';

/**
 * 🍪 Extract and decode session token from raw cookie header (Edge-safe)
 */
export async function getSessionFromCookieHeader(
  cookieHeader: string | null | undefined
): Promise<Record<string, any> | null> {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('=').map(decodeURIComponent))
  );

  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  return await decodeSessionToken(token);
}