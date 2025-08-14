import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionOrTokenFallback } from '@/lib/auth/sessionFallback';

/**
 * 🔍 Debug mobile-compatible fallback session behavior
 * - Checks for cookie presence
 * - Decodes token from cookie or query string fallback
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token') || undefined;

  const rawCookie = (await cookies()).get('axpt_session')?.value ?? null;
  const fallbackSession = await getSessionOrTokenFallback(tokenFromQuery);

  return NextResponse.json({
    method: 'tokenFallback',
    cookiePresent: !!rawCookie,
    rawCookie,
    fallbackSession,
  });
}