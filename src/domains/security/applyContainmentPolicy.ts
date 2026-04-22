import { prisma } from '@/infrastructure/db/prisma'
import {
  type ContainmentZone,
  normalizeContainmentZoneMembers,
} from './containmentZone'

export async function applyContainmentPolicy(zones: ContainmentZone[]) {
  let quarantined = 0
  let frozen = 0

  for (const zone of zones) {
    for (const userId of normalizeContainmentZoneMembers(zone.members)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      })

      const meta = (user?.metadata as Record<string, unknown>) ?? {}

      if (zone.severity === 'SEALED') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...meta,
              quarantine: true,
              quarantineReason: 'CONTAINMENT_ZONE_SEALED',
            },
          },
        })

        quarantined++
        continue
      }

      if (zone.severity === 'HOT') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...meta,
              frozen: true,
              freezeReason: 'CONTAINMENT_ZONE_HOT',
            },
          },
        })

        frozen++
        continue
      }

      if (zone.severity === 'WATCH') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...meta,
              watch: true,
              watchReason: 'CONTAINMENT_ZONE_WATCH',
            },
          },
        })
      }
    }
  }

  await prisma.eventLog.create({
    data: {
      type: 'CONTAINMENT_ZONE_POLICY_APPLIED',
      metadata: {
        zonesProcessed: zones.length,
        quarantined,
        frozen,
        timestamp: new Date().toISOString(),
      },
    },
  })

  return { quarantined, frozen }
}
