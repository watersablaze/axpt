// app/src/lib/auth/session.ts

import { serialize } from 'cookie';
import { SignJWT, jwtVerify } from 'jose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const secret = process.env.SESSION_SECRET || 'changeme';
const secretKey = new TextEncoder().encode(secret);

export type SessionPayload = {
  userId: string;
  name?: string;
  tier: string;
};

const EXPIRATION_TIME = 60 * 60 * 24 * 30; // 30 days

// ✅ Create signed cookie
export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRATION_TIME}s`)
    .sign(secretKey);

  return serialize('axpt_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: EXPIRATION_TIME,
  });
}

// ✅ Decode cookie token
export async function decodeSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch (err) {
    console.error('Session decode error:', err);
    return null;
  }
}

// ✅ Clear cookie
export function clearSessionCookie(): string {
  return `axpt_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ✅ Server-side cookie access
export function getSessionCookieServer(): string | null {
  try {
    const { cookies } = require('next/headers');
    return cookies().get('axpt_session')?.value || null;
  } catch {
    return null;
  }
}

// ✅ Client-side cookie access
export function getSessionCookieClient(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)axpt_session=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ✅ Get userId via next-auth session
export async function getLoggedInUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}