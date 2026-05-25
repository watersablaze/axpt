import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  deriveActiveIncidents,
  type ActiveIncident,
} from '@/components/panels/utils/incidentCognition'
import type {
  EventRow,
} from '@/components/panels/utils/eventCognition'

const WINDOW_MS = 1000 * 60 * 10

type IncidentResponse = ActiveIncident & {
  resolved: boolean
}

export async function GET() {
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

  const derivedIncidents = deriveActiveIncidents(normalizedEvents)

  const incidentKeys = derivedIncidents.map(
    (incident) => incident.id
  )

  const persisted =
    incidentKeys.length > 0
      ? await prisma.activeIncident.findMany({
          where: {
            incidentKey: {
              in: incidentKeys,
            },
          },
        })
      : []

  type PersistedIncident = (typeof persisted)[number]

  const persistedByKey =
    new Map<string, PersistedIncident>(
      persisted.map((incident: PersistedIncident) => [
        incident.incidentKey,
        incident,
      ])
    )

  const incidents: IncidentResponse[] = derivedIncidents
    .map((incident): IncidentResponse => {
      const saved = persistedByKey.get(incident.id)

      if (!saved) {
        return {
          ...incident,
          resolved: false,
        }
      }

      return {
        ...incident,
        acknowledged: saved.acknowledged,
        resolved: saved.resolved,
        openedAt: saved.openedAt.toISOString(),
        latestAt: saved.latestAt.toISOString(),
        eventCount: saved.eventCount,
      }
    })
    .filter((incident) => !incident.resolved)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    windowMs: WINDOW_MS,
    incidents,
  })
}