// lib/auth/getSessionFromCookie.ts
import { cookies } from 'next/headers';
import { decodeSessionToken, SESSION_COOKIE_NAME } from './session';

export async function getSessionFromCookie() {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  return await decodeSessionToken(cookie);
}