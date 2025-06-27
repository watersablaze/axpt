export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/getSessionFromCookie';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieJar = cookies();
  const session = await getSessionFromCookie(cookieJar);

  const res = session
    ? NextResponse.json({ authorized: true, session })
    : NextResponse.json({ authorized: false }, { status: 401 });

  res.headers.set('Cache-Control', 'no-store');
  return res;
}