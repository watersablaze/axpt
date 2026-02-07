 /**
 * AUTH BYPASS NOTICE
 * ------------------
 * This function is intentionally bypassed during infra build-out.
 * Reintroduce auth AFTER:
 * - custodial flows are complete
 * - escrow lifecycle is validated
 * - admin UX is finalized
 */

import { prisma } from '@/lib/prisma';

export async function requireResidentServer() {
  // TEMPORARY AUTH BYPASS — INFRA BUILD PHASE
  // This will be removed when auth is reintroduced intentionally

  const user = await prisma.user.findFirst({
    select: { id: true, email: true, name: true, tier: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    return {
    userId: 'DEV_USER',
    user: {
      id: 'DEV_USER',
      email: 'dev@axpt.local',
      name: 'Dev Resident',
      tier: 'DEV',
    },
  };
}

  return { userId: user.id, user };
}