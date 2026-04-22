import { prisma } from '@/infrastructure/db/prisma'
import {
  type ContainmentZone,
  type ContainmentZoneSeverity,
  buildContainmentZoneKey,
  isContainmentZoneSeverity,
  normalizeContainmentZoneMembers,
} from './containmentZone'

function escalateSeverity(
  severity: ContainmentZoneSeverity
): ContainmentZoneSeverity {
  if (severity === 'WATCH') return 'HOT'
  if (severity === 'HOT') return 'SEALED'
  return severity
}

function downgradeSeverity(
  severity: ContainmentZoneSeverity
): ContainmentZoneSeverity {
  if (severity === 'SEALED') return 'HOT'
  if (severity === 'HOT') return 'WATCH'
  if (severity === 'WATCH') return 'NORMAL'
  return severity
}

function resolveHistoricalSeverity(
  metadata: Record<string, unknown>,
  zone: ContainmentZone
): ContainmentZoneSeverity {
  const persistedKey =
    typeof metadata.containmentZoneKey === 'string'
      ? metadata.containmentZoneKey
      : null

  if (
    persistedKey === buildContainmentZoneKey(zone) &&
    isContainmentZoneSeverity(metadata.containmentZoneSeverity)
  ) {
    return metadata.containmentZoneSeverity
  }

  if (
    typeof metadata.containmentZoneId === 'string' &&
    metadata.containmentZoneId === zone.zoneId &&
    isContainmentZoneSeverity(metadata.containmentZoneSeverity)
  ) {
    return metadata.containmentZoneSeverity
  }

  return zone.severity
}

export async function evolveContainmentZones(
  currentZones: ContainmentZone[]
): Promise<ContainmentZone[]> {
  const evolvedZones: ContainmentZone[] = []

  for (const zone of currentZones) {
    const normalizedMembers = normalizeContainmentZoneMembers(zone.members)
    let historicalSeverity: ContainmentZoneSeverity = zone.severity

    if (normalizedMembers.length > 0) {
      const sampleUser = await prisma.user.findFirst({
        where: {
          id: { in: normalizedMembers },
        },
        select: { metadata: true },
      })

      const metadata =
        (sampleUser?.metadata as Record<string, unknown> | null) ?? {}

      historicalSeverity = resolveHistoricalSeverity(metadata, {
        ...zone,
        members: normalizedMembers,
      })
    }

    let nextSeverity = zone.severity

    if (zone.avgThreat > 8 && historicalSeverity !== 'SEALED') {
      nextSeverity = escalateSeverity(historicalSeverity)
    }

    if (zone.avgThreat < 3 && historicalSeverity !== 'NORMAL') {
      nextSeverity = downgradeSeverity(historicalSeverity)
    }

    let expandedMembers = normalizedMembers

    if (zone.avgThreat > 6) {
      const nearby = await prisma.user.findMany({
        where: {
          metadata: {
            path: ['clusterId'],
            equals: zone.zoneId,
          },
        },
        select: { id: true },
      })

      expandedMembers = normalizeContainmentZoneMembers([
        ...normalizedMembers,
        ...nearby.map((user: { id: string }) => user.id),
      ])
    }

    evolvedZones.push({
      zoneId: zone.zoneId,
      avgRisk: zone.avgRisk,
      avgAnomaly: zone.avgAnomaly,
      avgThreat: zone.avgThreat,
      density: zone.density,
      severity: nextSeverity,
      members: expandedMembers,
    })
  }

  return evolvedZones
}
