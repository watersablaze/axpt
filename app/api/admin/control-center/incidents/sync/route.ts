import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  deriveActiveIncidents,
} from '@/components/panels/utils/incidentCognition'
import type {
  EventRow,
} from '@/components/panels/utils/eventCognition'
import { EventTypes } from '@/core/events/types'
import { appendIncidentLifecycleEvent } from '@/core/events/appendIncidentLifecycleEvent'

const WINDOW_MS = 1000 * 60 * 10

export async function POST() {
  const since = new Date(Date.now() - WINDOW_MS)

  const events = await prisma.domainEvent.findMany({
    where: {
      occurredAt: {
        gte: since,
      },
    },
    orderBy: {
      occurredAt: 'desc',
    },
    take: 200,
  })

  type DomainEventRecord = (typeof events)[number]

  const normalizedEvents: EventRow[] = events.map(
    (event: DomainEventRecord) => ({
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
          ? (event.metadata as EventRow['metadata'])
          : undefined,
    })
  )

  const derivedIncidents =
    deriveActiveIncidents(normalizedEvents)

  const synced = []

for (const incident of derivedIncidents) {
  const latestAt = incident.latestAt
    ? new Date(incident.latestAt)
    : new Date()

  const openedAt = incident.openedAt
    ? new Date(incident.openedAt)
    : latestAt

  const existing = await prisma.activeIncident.findUnique({
    where: {
      incidentKey: incident.id,
    },
  })

  if (!existing) {
    const created = await prisma.activeIncident.create({
      data: {
        incidentKey: incident.id,
        title: incident.title,
        detail: incident.detail,
        severity: incident.severity,
        streamType: incident.streamType,
        openedAt,
        latestAt,
        eventCount: incident.eventCount,
      },
    })

    synced.push(created)
    continue
  }

  const shouldReopen =
    existing.resolved &&
    existing.resolvedAt &&
    latestAt > existing.resolvedAt

  const updated = await prisma.activeIncident.update({
    where: {
      incidentKey: incident.id,
    },
    data: {
      title: incident.title,
      detail: incident.detail,
      severity: incident.severity,
      streamType: incident.streamType,
      latestAt,
      eventCount: incident.eventCount,

      ...(shouldReopen
        ? {
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
          }
        : {}),
    },
  })

if (shouldReopen) {
  await appendIncidentLifecycleEvent({
    incidentKey: incident.id,
    action: EventTypes.INCIDENT_REOPENED,
    streamType: incident.streamType,
    metadata: {
      latestAt: latestAt.toISOString(),
      eventCount: incident.eventCount,
    },
  })
}

  synced.push(updated)
}

  return NextResponse.json({
    ok: true,
    synced: synced.length,
    incidents: synced,
  })
}