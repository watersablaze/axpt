import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/getSessionFromCookie';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const cookieJar = cookies();
  const session = await getSessionFromCookie(cookieJar);

  // Audit log (if session is found)
  if (session?.userId) {
    try {
      await prisma.logoutLog.create({
        data: {
          userId: session.userId,
          timestamp: new Date(),
          reason: 'manual-logout',
          ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (err) {
      console.error('❌ Failed to log logout event:', err);
    }
  }

  // Kill session cookie
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  res.headers.set(
    'Set-Cookie',
    'axpt_session=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );

  return res;
}