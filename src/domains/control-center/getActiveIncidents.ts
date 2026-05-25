import { prisma } from '@/lib/prisma'

export async function getActiveIncidents() {
  const incidents = await prisma.activeIncident.findMany({
    where: { resolved: false },
    orderBy: { latestAt: 'desc' },
    take: 50,
  })
  
  type ActiveIncidentRecord = (typeof incidents)[number]

  return incidents.map((incident: ActiveIncidentRecord) => ({
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
  }))
}