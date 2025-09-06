// app/api/debug/whoami/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 404 });
  }

  const jar = await cookies();
  const sessionCookie = jar.get('axpt_session')?.value || null;

  let user: { id: string; email: string | null } | null = null;
  let elder: any = null;

  if (sessionCookie) {
    const payload = await decodeSessionToken(sessionCookie).catch(() => null);
    if (payload?.userId) {
      user = await prisma.user.findUnique({
        where: { id: String(payload.userId) },
        select: { id: true, email: true },
      });
    }
  }

  if (!user) {
    const imp = jar.get('dev_impersonate_email')?.value || null;
    if (imp) {
      user = await prisma.user.findUnique({
        where: { email: imp },
        select: { id: true, email: true },
      });
    }
  }

  if (user) {
    elder = await prisma.councilElder.findUnique({
      where: { userId: user.id },
      select: { id: true, isActive: true, title: true, joinedAt: true },
    });
  }

  return NextResponse.json({
    ok: true,
    user,
    elder,
    bypass: process.env.DISABLE_ADMIN_AUTH === '1',
  });
}