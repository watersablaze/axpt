import { prisma } from '@/infrastructure/db/prisma'
import { mergeUserMetadata } from './mergeUserMetadata'

export async function freezeUserIfCriticalRisk(params: {
  userId: string
  riskScore: number
  reasons: string[]
}) {
  const { userId, riskScore, reasons } = params

  if (riskScore < 8) return

  await mergeUserMetadata(userId, {
    frozen: true,
    frozenReason: reasons,
    frozenAt: new Date().toISOString(),
  })

  await prisma.eventLog.create({
    data: {
      type: 'USER_FROZEN',
      metadata: {
        userId,
        riskScore,
        reasons,
      },
    },
  })
}