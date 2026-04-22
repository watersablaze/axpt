import { prisma } from '@/infrastructure/db/prisma'
import {
  type ContainmentZone,
  buildContainmentZoneKey,
  normalizeContainmentZoneMembers,
} from './containmentZone'

function hasSameContainmentState(
  metadata: Record<string, unknown>,
  zone: ContainmentZone,
  zoneKey: string
): boolean {
  const currentZoneId =
    typeof metadata.containmentZoneId === 'string'
      ? metadata.containmentZoneId
      : null
  const currentSeverity =
    typeof metadata.containmentZoneSeverity === 'string'
      ? metadata.containmentZoneSeverity
      : null
  const currentZoneKey =
    typeof metadata.containmentZoneKey === 'string'
      ? metadata.containmentZoneKey
      : null
  const currentMembers = Array.isArray(metadata.containmentZoneMembers)
    ? normalizeContainmentZoneMembers(
        metadata.containmentZoneMembers.filter(
          (member): member is string => typeof member === 'string'
        )
      )
    : []

  return (
    currentZoneId === zone.zoneId &&
    currentSeverity === zone.severity &&
    currentZoneKey === zoneKey &&
    currentMembers.length === zone.members.length &&
    currentMembers.every((member, index) => member === zone.members[index])
  )
}

export async function persistContainmentZones(zones: ContainmentZone[]) {
  let updated = 0

  for (const zone of zones) {
    const normalizedMembers = normalizeContainmentZoneMembers(zone.members)
    const normalizedZone: ContainmentZone = {
      ...zone,
      members: normalizedMembers,
    }
    const zoneKey = buildContainmentZoneKey(normalizedZone)
    let zoneChanged = false

    for (const userId of normalizedMembers) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      })

      const metadata =
        (user?.metadata as Record<string, unknown> | null) ?? {}

      if (hasSameContainmentState(metadata, normalizedZone, zoneKey)) {
        continue
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...metadata,
            containmentZoneId: normalizedZone.zoneId,
            containmentZoneSeverity: normalizedZone.severity,
            containmentZoneMembers: normalizedMembers,
            containmentZoneKey: zoneKey,
            containmentZoneUpdatedAt: new Date().toISOString(),
          },
        },
      })

      updated++
      zoneChanged = true
    }

    if (!zoneChanged) {
      continue
    }

    await prisma.eventLog.create({
      data: {
        type: 'CONTAINMENT_ZONE_COMPUTED',
        metadata: {
          containmentZoneId: normalizedZone.zoneId,
          severity: normalizedZone.severity,
          size: normalizedMembers.length,
          avgRisk: normalizedZone.avgRisk,
          avgThreat: normalizedZone.avgThreat,
          members: normalizedMembers,
        },
      },
    })
  }

  return { updated }
}
