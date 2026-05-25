import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  aggregateIncidentSignals,
} from '@/components/panels/utils/intelligenceAggregation'

export async function GET() {
  const activeIncidents =
    await prisma.activeIncident.findMany({
      where: {
        resolved: false,
      },
      orderBy: {
        latestAt: 'desc',
      },
      take: 50,
    })

    type ActiveIncidentRecord =
  (typeof activeIncidents)[number]

  const normalizedIncidents = activeIncidents.map(
    (incident: ActiveIncidentRecord) => ({
      id: incident.incidentKey,
      severity:
        incident.severity === 'CRITICAL'
          ? 'CRITICAL'
          : 'WARNING',
      title: incident.title,
      detail: incident.detail,
      streamType: incident.streamType,
      openedAt: incident.openedAt.toISOString(),
      latestAt: incident.latestAt.toISOString(),
      eventCount: incident.eventCount,
      acknowledged: incident.acknowledged,
      resolved: incident.resolved,
    })
  )

  const signals =
    aggregateIncidentSignals(normalizedIncidents)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    signals,
  })
}