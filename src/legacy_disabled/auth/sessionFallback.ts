import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { SESSION_COOKIE_NAME } from '@/shared/constants/cookies';
import { SIGNING_SECRET } from '@/infrastructure/env/secrets';
import type { SessionPayload } from '@/shared/types/auth';

/**
 * @deprecated
 * LEGACY DEV BYPASS
 *
 * DO NOT USE FOR CONTROL CENTER,
 * TREASURY, OR GOVERNANCE FLOWS.
 *
 * Replace with getPrincipal().
 */

const allowedDocs = ['whitepaper', 'hemp', 'chinje'] as const;
type DocType = typeof allowedDocs[number];

/**
 * 🔐 Decode token with runtime guards
 */
export async function decodeSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SIGNING_SECRET);

    const {
      userId,
      tier,
      displayName,
      popupMessage,
      greeting,
      email,
      partner,
      docs,
      iat,
      exp,
    } = payload;

    if (
      typeof userId !== 'string' ||
      typeof tier !== 'string' ||
      typeof displayName !== 'string' ||
      typeof popupMessage !== 'string' ||
      typeof greeting !== 'string' ||
      typeof email !== 'string' ||
      typeof partner !== 'string' ||
      !Array.isArray(docs) ||
      typeof iat !== 'number' ||
      typeof exp !== 'number'
    ) {
      console.warn('Invalid fallback session payload structure');
      return null;
    }

    return {
      userId,
      tier: tier as SessionPayload['tier'],
      roles: Array.isArray(payload.roles)
        ? payload.roles.filter(
            (role): role is SessionPayload['roles'][number] =>
              typeof role === 'string'
          )
        : [],
      displayName,
      popupMessage,
      greeting,
      email,
      partner,
      docs: docs.filter((doc): doc is DocType => allowedDocs.includes(doc as DocType)),
      iat,
      exp,
    };
  } catch (err) {
    console.error('❌ sessionFallback decode failed:', err);
    return null;
  }
}

/**
 * 🌐 Get session token from cookie or query string
 */
export async function getSessionOrTokenFallback(tokenFromQuery?: string): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = tokenFromQuery || cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return await decodeSessionToken(token);
}
