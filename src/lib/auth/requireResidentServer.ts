// src/lib/auth/requireResidentServer.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

export async function requireResidentServer() {
  const jar = await cookies();
  const sessionCookie = jar.get('axpt_session')?.value || null;

  // Try real app session first
  if (sessionCookie) {
    const payload = await decodeSessionToken(sessionCookie).catch(() => null);
    if (payload?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: String(payload.userId) },
        select: { id: true, email: true, name: true, tier: true },
      });
      if (user) return { userId: user.id, user };
    }
  }

  // Dev fallback: allow impersonation cookie outside production
  if (process.env.NODE_ENV !== 'production') {
    const imp = jar.get('dev_impersonate_email')?.value || null;
    if (imp) {
      const user = await prisma.user.findUnique({
        where: { email: imp },
        select: { id: true, email: true, name: true, tier: true },
      });
      if (user) return { userId: user.id, user };
    }
  }

  redirect('/'); // not authenticated
}