// app/src/lib/auth/getCurrentUser.ts

'use server';

import { cookies } from 'next/headers';
import { getSessionFromCookie } from './getSessionFromCookie';
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  // ✅ Correct: `cookies()` is synchronous
  const cookieJar = await cookies();

  const session = await getSessionFromCookie(cookieJar);
  if (!session?.userId) return null;

  try {
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
  } catch (err) {
    console.error('❌ Failed to fetch user from Prisma:', err);
    return null;
  }
}