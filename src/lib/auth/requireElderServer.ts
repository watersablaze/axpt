import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

export async function requireElderServer() {
  const jar = await cookies();
  const sessionCookie = jar.get('axpt_session')?.value || null;

  // 0) Hard dev bypass: create/use a local elder automatically
  if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_ELDER_GUARD === '1') {
    const email = 'dev-elder@local';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        username: 'dev-elder',
        passwordHash: 'local-dev',
        isAdmin: true,
      },
      select: { id: true, email: true },
    });
    const elder = await prisma.councilElder.upsert({
      where: { userId: user.id },
      update: { isActive: true },
      create: { userId: user.id, isActive: true, title: 'Dev Elder' },
      select: { id: true, userId: true, isActive: true, title: true, joinedAt: true },
    });
    return { elder, user };
  }

  // 1) Normal cookie session
  let actingUser: { id: string; email: string | null } | null = null;
  if (sessionCookie) {
    const payload = await decodeSessionToken(sessionCookie).catch(() => null);
    if (payload?.userId) {
      actingUser = await prisma.user.findUnique({
        where: { id: String(payload.userId) },
        select: { id: true, email: true },
      });
    }
  }

  // 2) Dev impersonation cookie
  if (!actingUser && process.env.NODE_ENV !== 'production') {
    const imp = jar.get('dev_impersonate_email')?.value || null;
    if (imp) {
      actingUser = await prisma.user.findUnique({
        where: { email: imp },
        select: { id: true, email: true },
      });
    }
  }

  if (!actingUser) redirect('/landing');

  const elder = await prisma.councilElder.findUnique({
    where: { userId: actingUser.id },
    select: { id: true, userId: true, isActive: true, title: true, joinedAt: true },
  });

  if (!elder || !elder.isActive) redirect('/landing');

  return { elder, user: actingUser };
}