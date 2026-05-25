import { prisma } from '@/lib/prisma'

export async function getTimelineFeed() {
  const events = await prisma.domainEvent.findMany({
    orderBy: { occurredAt: 'desc' },
    take: 40,
  })

  type TimelineEventRecord = (typeof events)[number]

  return events.map((event: TimelineEventRecord) => ({
    id: event.id,
    type: event.eventType,
    streamType: event.streamType,
    streamId: event.streamId,
    occurredAt: event.occurredAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
    metadata:
      event.metadata &&
      typeof event.metadata === 'object' &&
      !Array.isArray(event.metadata)
        ? event.metadata
        : undefined,
  }))
}