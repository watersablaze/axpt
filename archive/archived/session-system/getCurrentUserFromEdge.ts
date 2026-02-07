import { decodeToken } from '@/lib/token/decodeToken';
import type { SessionPayload } from '@/types/auth';

/**
 * 🍪 Extract and decode session token from raw cookie header (Edge-safe)
 */
export async function getSessionFromCookieHeader(
  cookieHeader: string | null | undefined
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('=').map(decodeURIComponent))
  );

  const token = cookies['axpt_session'];
  if (!token) return null;

  const payload = decodeToken(token);

  if (
    payload &&
    typeof payload.userId === 'string' &&
    typeof payload.tier === 'string'
  ) {
    return payload as SessionPayload;
  }

  return null; // ✅ Ensure all code paths return
}