// src/lib/auth/requireElderServer.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

export async function requireElderServer() {
  const jar = await cookies();
  const sessionCookie = jar.get('axpt_session')?.value || null;

  let actingUser = null as null | { id: string; email: string | null };
  if (sessionCookie) {
    const payload = await decodeSessionToken(sessionCookie).catch(() => null);
    if (payload?.userId) {
      actingUser = await prisma.user.findUnique({
        where: { id: String(payload.userId) },
        select: { id: true, email: true },
      });
    }
  }

  // In dev, allow impersonation fallback if no real session
  if (!actingUser && process.env.NODE_ENV !== 'production') {
    const imp = jar.get('dev_impersonate_email')?.value || null;
    if (imp) {
      actingUser = await prisma.user.findUnique({
        where: { email: imp },
        select: { id: true, email: true },
      });
    }
  }

  if (!actingUser) redirect('/'); // not logged in

  const elder = await prisma.councilElder.findUnique({
    where: { userId: actingUser.id },
    select: { id: true, userId: true, isActive: true, title: true, joinedAt: true },
  });

  if (!elder || !elder.isActive) redirect('/'); // not an elder

  return { elder, user: actingUser };
}