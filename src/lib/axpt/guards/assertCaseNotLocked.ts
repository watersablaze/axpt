import { prisma } from '@/lib/prisma';

export async function assertCaseNotLocked(caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { status: true },
  });

  if (!c) {
    throw new Error('CASE_NOT_FOUND');
  }

  if (c.status === 'ESCROW_INITIATED') {
    const err = new Error('CASE_LOCKED_AFTER_ESCROW');
    // @ts-ignore
    err.code = 'CASE_LOCKED_AFTER_ESCROW';
    throw err;
  }

  return c;
}