import { cookies } from 'next/headers';
import { getTokenSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('axpt_session')?.value || null;
  const session = await getTokenSession();

  return NextResponse.json({
    cookiePresent: !!rawCookie,
    rawCookie,
    decodedSession: session,
  });
}