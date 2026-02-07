// 📁 app/src/lib/server/sessionCookie.ts

import { cookies } from 'next/headers';

const COOKIE_KEY = 'axpt_token';

export async function createSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_KEY, token, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24,
  });
}

export async function getSessionTokenFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_KEY)?.value || null;
}

export async function deleteSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_KEY);
}