import prisma from '@/lib/prisma';
import { hashToken } from '@/utils/secureToken';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export async function getSessionFromCookie(cookies: ReadonlyRequestCookies) {
  const rawToken = cookies.get('axpt_session')?.value;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const user = await prisma.user.findFirst({
    where: { accessTokenHash: tokenHash },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
  };
}