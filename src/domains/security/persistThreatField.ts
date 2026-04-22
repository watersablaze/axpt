import { prisma } from '@/infrastructure/db/prisma'
import { mergeUserMetadata } from './mergeUserMetadata'

export async function persistThreatField(field: Map<string, number>) {
  let updated = 0

  for (const [userId, threatScore] of field.entries()) {
    await mergeUserMetadata(userId, {
      threatScore,
      threatUpdatedAt: new Date().toISOString(),
    })

    updated++
  }

  await prisma.eventLog.create({
    data: {
      type: 'THREAT_FIELD_PERSISTED',
      metadata: {
        updated,
        timestamp: new Date().toISOString(),
      },
    },
  })

  return { updated }
}