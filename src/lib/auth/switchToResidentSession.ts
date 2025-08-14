// src/lib/auth/switchToResidentSession.ts
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_SECRET } from './sessionSecrets';

interface SessionPayload {
  userId: string;
  walletId?: string;
  email?: string;
  tier?: string;
}

export async function switchToResidentSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET);

  // Some Next typings return Promise<ReadonlyRequestCookies>
  const cookieStore: any = await (cookies() as any);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  cookieStore.delete('token_bearer');
}