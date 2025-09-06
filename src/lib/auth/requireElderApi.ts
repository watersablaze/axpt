// src/lib/auth/requireElderApi.ts
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

export async function requireElderApi() {
  const jar = await cookies();
  const sessionCookie = jar.get('axpt_session')?.value || null;

  let user: { id: string; email: string | null } | null = null;

  if (sessionCookie) {
    const payload = await decodeSessionToken(sessionCookie).catch(() => null);
    if (payload?.userId) {
      user = await prisma.user.findUnique({
        where: { id: String(payload.userId) },
        select: { id: true, email: true },
      });
    }
  }

  // Dev bypass: impersonate via cookie (optional)
  if (!user && process.env.NODE_ENV !== 'production') {
    const imp = jar.get('dev_impersonate_email')?.value || null;
    if (imp) {
      user = await prisma.user.findUnique({
        where: { email: imp },
        select: { id: true, email: true },
      });
    }
  }

  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const elder = await prisma.councilElder.findUnique({
    where: { userId: user.id },
    select: { id: true, isActive: true },
  });

  if (!elder || !elder.isActive) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  return { user, elder };
}