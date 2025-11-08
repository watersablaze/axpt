// src/lib/axis/axisJourneyService.ts
import { prisma } from '@/lib/prisma';

export async function getRecentSubscribers(limit = 25) {
  return prisma.axisJourneySubscriber.findMany({
    orderBy: { joinedAt: 'desc' },
    take: limit,
  });
}

export async function getConfirmedSubscribers(limit = 25) {
  return prisma.axisJourneySubscriber.findMany({
    where: { confirmed: true },
    orderBy: { confirmationAt: 'desc' },
    take: limit,
  });
}

export async function countSubscribersByOrigin() {
  const result = await prisma.axisJourneySubscriber.groupBy({
    by: ['origin'],
    _count: { origin: true },
    orderBy: { _count: { origin: 'desc' } },
  });
  return result.map((r) => ({
    origin: r.origin ?? 'unknown',
    count: r._count.origin,
  }));
}