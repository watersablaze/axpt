'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

import { SESSION_COOKIE_NAME } from '@/constants/cookies'; // ✅ Ensure this matches filename
import { SIGNING_SECRET } from '@/lib/env/secrets';
import type { SessionPayload } from '@/types/auth';
import { verifyToken } from '@/lib/token/verifyToken';

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
  const cookieStore = await cookies(); // ✅ FIXED
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * ❌ Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies(); // ✅ FIXED
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
  const cookieStore = await cookies(); // ✅ FIXED
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
    return {
      userId: payload.userId as string,
      tier: payload.tier as string,
      displayName: payload.displayName as string,
      popupMessage: payload.popupMessage as string,
      docs: payload.docs as string[],
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
  return valid ? payload ?? null : null;
}

/**
 * 🪞 Alias: use getTokenSession() anywhere you’d use getSessionFromCookie()
 */
export async function getTokenSession(): Promise<SessionPayload | null> {
  return await getSessionFromCookie();
}