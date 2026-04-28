import { prisma } from '@/infrastructure/db/prisma'
import type { UserTrustState } from './trustTypes'

export async function computeUserTrustState(
  userId: string
): Promise<UserTrustState> {
  const events = await prisma.eventLog.findMany({
    where: {
      action: 'RISK_EVALUATION',
      detail: {
        path: ['userId'],
        equals: userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  let successCount = 0
  let failureCount = 0
  let totalRisk = 0

  for (const e of events) {
    const meta = e.detail as any

    const risk = Number(meta?.riskScore ?? 0)
    totalRisk += risk

    if (risk <= 2) successCount++
    else if (risk >= 5) failureCount++
  }

  const totalEvents = events.length

  const safeTotal = totalEvents === 0 ? 1 : totalEvents

  return {
    totalEvents,

    successCount,
    failureCount,

    successRate: successCount / safeTotal,
    failureRate: failureCount / safeTotal,

    avgRisk: totalRisk / safeTotal,

    lastEvaluatedAt:
      events[0]?.createdAt?.toISOString() ?? null,
  }
}