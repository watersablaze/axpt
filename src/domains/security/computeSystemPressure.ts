import { prisma } from '@/infrastructure/db/prisma'

export type SystemPressure = {
  pressureScore: number
  riskDensity: number
  anomalyRate: number
  txVelocity: number
  mode: 'NORMAL' | 'ELEVATED' | 'DEFENSIVE' | 'LOCKDOWN'
}

export async function computeSystemPressure(): Promise<SystemPressure> {
  const oneMinuteAgo = new Date(Date.now() - 60_000)

  const [recentTx, recentRisk] = await Promise.all([
    prisma.transaction.count({
      where: {
        createdAt: { gte: oneMinuteAgo },
      },
    }),
    prisma.eventLog.findMany({
      where: {
        type: 'RISK_SNAPSHOT_PERSISTED',
        createdAt: { gte: oneMinuteAgo },
      },
      select: { metadata: true },
    }),
  ])

  let highRiskCount = 0

  for (const event of recentRisk) {
    const level = (event.metadata as any)?.riskLevel
    if (level === 'HIGH') highRiskCount++
  }

  const riskDensity =
    recentRisk.length > 0 ? highRiskCount / recentRisk.length : 0

  const anomalyRate = riskDensity
  const txVelocity = recentTx

  const pressureScore =
    txVelocity * 0.2 +
    riskDensity * 10 +
    anomalyRate * 10

  let mode: SystemPressure['mode'] = 'NORMAL'

  if (pressureScore > 25) mode = 'LOCKDOWN'
  else if (pressureScore > 15) mode = 'DEFENSIVE'
  else if (pressureScore > 8) mode = 'ELEVATED'

  return {
    pressureScore,
    riskDensity,
    anomalyRate,
    txVelocity,
    mode,
  }
}