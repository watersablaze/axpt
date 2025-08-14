'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

import { SESSION_COOKIE_NAME } from '@/constants/cookies';
import { SIGNING_SECRET } from '@/lib/env/secrets';
import type { SessionPayload } from '@/types/auth';
import { verifyToken } from '@/lib/token/verifyToken';

const allowedDocs = ['whitepaper', 'hemp', 'chinje'] as const;
type DocType = typeof allowedDocs[number];

/**
 * 🔐 Create a signed JWT from session payload
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 days

  return await new SignJWT({ ...payload, iat, exp })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(SIGNING_SECRET);
}

/**
 * 🍪 Write session token to secure cookie
 */
export async function createSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    path: '/',
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * ❌ Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
}

/**
 * 🍪 Get raw token string directly from cookie
 */
export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * 🧬 Decode session token (fallback or legacy flow)
 */
export async function decodeSessionToken(tokenFromHeader?: string): Promise<SessionPayload | null> {
  const token = tokenFromHeader || (await getTokenFromCookie());
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SIGNING_SECRET);

    if (
      !payload.userId ||
      !payload.tier ||
      !payload.displayName ||
      !payload.popupMessage ||
      !payload.greeting ||
      !payload.email ||
      !payload.partner ||
      !payload.docs ||
      !payload.iat ||
      !payload.exp
    ) {
      return null;
    }

    return {
      userId: payload.userId as string,
      tier: payload.tier as SessionPayload['tier'],
      displayName: payload.displayName as string,
      popupMessage: payload.popupMessage as string,
      greeting: payload.greeting as string,
      email: payload.email as string,
      partner: payload.partner as string,
      docs: (payload.docs as string[]).filter((doc): doc is DocType => allowedDocs.includes(doc as DocType)),
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (err) {
    console.warn('❌ Invalid session token:', err);
    return null;
  }
}

/**
 * ✅ Securely verify session token from cookie and return payload
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const token = await getTokenFromCookie();
  if (!token) return null;

  const { valid, payload } = await verifyToken(token);
  if (!valid || !payload) return null;

  if (
    !payload.userId ||
    !payload.tier ||
    !payload.displayName ||
    !payload.popupMessage ||
    !payload.greeting ||
    !payload.email ||
    !payload.partner ||
    !payload.docs ||
    !payload.iat ||
    !payload.exp
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    tier: payload.tier,
    displayName: payload.displayName,
    popupMessage: payload.popupMessage,
    greeting: payload.greeting,
    email: payload.email,
    partner: payload.partner,
    docs: payload.docs.filter((doc): doc is DocType => allowedDocs.includes(doc as DocType)),
    iat: payload.iat,
    exp: payload.exp,
  };
}

/**
 * 🪞 Alias: use getTokenSession() anywhere you’d use getSessionFromCookie()
 */
export async function getTokenSession(): Promise<SessionPayload | null> {
  return await getSessionFromCookie();
}