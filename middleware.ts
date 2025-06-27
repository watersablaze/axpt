/* app/middleware.ts */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromEdge } from '@/lib/auth/getCurrentUserFromEdge';

export const runtime = 'experimental-edge';

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60;

const ipRequestTimestamps = new Map<string, number[]>();

function generateTraceId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // IP fallback logic (NextRequest.ip not supported in edge runtime)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  const traceId = generateTraceId();
  const res = NextResponse.next();
  res.headers.set('x-trace-id', traceId);

  // Basic Rate Limiting
  const now = Date.now();
  const timestamps = ipRequestTimestamps.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests', traceId }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
      },
    });
  }

  recent.push(now);
  ipRequestTimestamps.set(ip, recent);

  // Example: protect dashboard
  if (pathname === '/account/dashboard') {
    const user = await getCurrentUserFromEdge(req);

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.redirect(new URL(`/account/dashboard/${user.tier}`, req.url));
  }

  return res;
}

export const config = {
  matcher: ['/account/:path*', '/dashboard/:path*', '/docs/:path*'],
};