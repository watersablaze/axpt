import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function handler() {
  const res = NextResponse.redirect('/login/pin');
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}