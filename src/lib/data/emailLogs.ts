import { prisma } from '@/lib/prisma';

export async function getRecentEmails(limit = 50) {
  return await prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}