import { cookies } from 'next/headers';
import { getSessionFromCookie } from './getSessionFromCookie';
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  const cookieJar = cookies();
  const session = await getSessionFromCookie(cookieJar);

  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
    },
  });

  return user;
}