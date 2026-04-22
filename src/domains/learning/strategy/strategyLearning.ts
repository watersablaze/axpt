import { prisma } from '@/infrastructure/db/prisma'

function computeTimeDecayWeight(createdAt: Date) {
  const ageMs = Date.now() - createdAt.getTime()
  const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 0)

  // 30-day half-life: recent outcomes matter more without discarding history.
  return Math.pow(0.5, ageDays / 30)
}

export type ScenarioHistoryStats = {
  scenarioId: string
  sampleCount: number
  successRate: number
  averageImpact: number
  confidenceWeight: number
}

export async function getScenarioHistoryStats(
  intent: string,
  assetCode?: string
): Promise<Record<string, ScenarioHistoryStats>> {
  const rows = await prisma.strategyOutcome.findMany({
    where: {
      intent,
      ...(assetCode ? { assetCode } : {}),
    },
    select: {
      scenarioId: true,
      success: true,
      impactScore: true,
      confidence: true,
      createdAt: true,
    },
  })

  const grouped = new Map<string, {
    count: number
    weightedSuccess: number
    weightedImpact: number
    totalWeight: number
    confidenceTotal: number
  }>()

  for (const row of rows) {
    const current = grouped.get(row.scenarioId) ?? {
      count: 0,
      weightedSuccess: 0,
      weightedImpact: 0,
      totalWeight: 0,
      confidenceTotal: 0,
    }
    const weight = computeTimeDecayWeight(row.createdAt)

    current.count += 1
    current.totalWeight += weight
    if (row.success) current.weightedSuccess += weight
    current.weightedImpact += (row.impactScore ?? 0) * weight
    current.confidenceTotal += row.confidence ?? 0

    grouped.set(row.scenarioId, current)
  }

  const result: Record<string, ScenarioHistoryStats> = {}

  for (const [scenarioId, g] of grouped.entries()) {
    const successRate = g.totalWeight > 0 ? g.weightedSuccess / g.totalWeight : 0
    const averageImpact = g.totalWeight > 0 ? g.weightedImpact / g.totalWeight : 0

    // soft confidence in the history itself, capped at 1
    const confidenceWeight = Math.min(g.count / 10, 1)

    result[scenarioId] = {
      scenarioId,
      sampleCount: g.count,
      successRate,
      averageImpact,
      confidenceWeight,
    }
  }

  return result
}
