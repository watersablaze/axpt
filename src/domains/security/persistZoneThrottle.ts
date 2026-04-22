import { prisma } from '@/infrastructure/db/prisma'
import { ZoneThrottle } from './computeZoneThrottle'

export async function persistZoneThrottle(
  throttles: ZoneThrottle[]
) {
  for (const t of throttles) {
    await prisma.systemState.upsert({
      where: { key: `zone:${t.zoneId}` },
      update: { value: t },
      create: { key: `zone:${t.zoneId}`, value: t },
    })
  }
}
