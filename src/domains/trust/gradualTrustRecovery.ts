import { prisma } from '@/infrastructure/db/prisma'

export async function gradualTrustRecovery(params: {
  userId: string
  maxEvents?: number
}) {
  const { userId, maxEvents = 25 } = params

  const events = await prisma.eventLog.findMany({
    where: {
      action: 'RISK_EVALUATION',
      detail: {
        path: ['userId'],
        equals: userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: maxEvents,
  })

  if (events.length === 0) {
    return {
      recovered: false,
      reason: 'No recent risk events',
    }
  }

  let lowRiskCount = 0

  for (const event of events) {
    const meta = event.detail as Record<string, unknown> | null
    const score = Number(meta?.riskScore ?? 0)

    if (score <= 2) {
      lowRiskCount++
    }
  }

  const recoveryRatio = lowRiskCount / events.length

  // only clear quarantine automatically, not full freeze
  if (recoveryRatio >= 0.8) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    const metadata = (user?.metadata as Record<string, unknown> | null) ?? {}

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          quarantine: false,
          quarantineReason: null,
          trustRecoveredAt: new Date().toISOString(),
          trustRecoveryRatio: recoveryRatio,
        },
      },
    })

    await prisma.eventLog.create({
      data: {
        actor: 'SYSTEM',
        action: 'TRUST_RECOVERY',
        detail: {
          userId,
          recoveryRatio,
          lowRiskCount,
          totalEvents: events.length,
        },
      },
    })

    return {
      recovered: true,
      recoveryRatio,
    }
  }

  return {
    recovered: false,
    recoveryRatio,
  }
}