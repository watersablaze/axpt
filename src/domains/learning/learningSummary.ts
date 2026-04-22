import { prisma } from '@/infrastructure/db/prisma'
import { computeTimeDecayWeight } from './timeDecay'

export type StrategySummary = {
  scenarioId: string
  sampleCount: number
  successRate: number
  averageImpact: number
  trend: 'UP' | 'DOWN' | 'FLAT'
}

export async function getLearningSummary(intent: string) {
  const rows = await prisma.strategyOutcome.findMany({
    where: { intent },
    orderBy: { createdAt: 'asc' },
  })

  const grouped = new Map<string, (typeof rows)[number][]>()

  for (const r of rows) {
    const list: (typeof rows)[number][] = grouped.get(r.scenarioId) ?? []
    list.push(r)
    grouped.set(r.scenarioId, list)
  }

  const summaries: StrategySummary[] = []

  for (const [scenarioId, entries] of grouped.entries()) {
    const count = entries.length
    const successRate =
      entries.filter((e) => e.success).length / count

    let weightedImpact = 0
    
    let totalWeight = 0

    for (const e of entries) {
    const weight = computeTimeDecayWeight(e.createdAt)

    weightedImpact += (e.impactScore ?? 0) * weight
    totalWeight += weight
    }

    const avgImpact = totalWeight > 0 ? weightedImpact / totalWeight : 0

    // trend = compare first half vs second half
    const mid = Math.floor(entries.length / 2)
    const first = entries.slice(0, mid)
    const second = entries.slice(mid)

    const firstAvg =
      first.reduce((s, e) => s + (e.impactScore ?? 0), 0) /
      (first.length || 1)

    const secondAvg =
      second.reduce((s, e) => s + (e.impactScore ?? 0), 0) /
      (second.length || 1)

    let trend: StrategySummary['trend'] = 'FLAT'
    if (secondAvg > firstAvg + 0.05) trend = 'UP'
    else if (secondAvg < firstAvg - 0.05) trend = 'DOWN'

    summaries.push({
      scenarioId,
      sampleCount: count,
      successRate,
      averageImpact: avgImpact,
      trend,
    })
  }

  return summaries.sort((a, b) => b.averageImpact - a.averageImpact)
}
