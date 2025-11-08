// src/lib/email/emailLogService.ts
import { prisma } from '@/lib/prisma';

/** Fetch the most recent emails (simple version, no pagination) */
export async function getRecentEmailLogs(limit = 20) {
  return prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      to: true,
      from: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });
}

/** Paginated (page/limit) version */
export async function getPaginatedEmailLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [emails, totalCount] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        to: true,
        from: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.emailLog.count(),
  ]);

  return {
    emails,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/** Group by email type */
export async function countEmailsByType() {
  const result = await prisma.emailLog.groupBy({
    by: ['type'],
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } },
  });
  return result.map(r => ({ type: r.type ?? 'unknown', count: r._count.type }));
}

/** Search (with pagination) */
export async function searchEmailLogs(query: string, limit = 20, skip = 0) {
  return prisma.emailLog.findMany({
    where: {
      OR: [
        { to: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    select: {
      id: true,
      type: true,
      to: true,
      from: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });
}