import { prisma } from '@/infrastructure/db/prisma'

export async function getReplayDriftSummary() {
  const audits = await prisma.replayAudit.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  if (!audits.length) {
    return {
      averageDivergence: 0,
      highDivergenceCount: 0,
      intentDriftRate: 0,
      mostUnstableIntent: null as string | null,
      byIntent: [] as Array<{
        intent: string
        averageDivergence: number
        count: number
        intentChangedRate: number
      }>,
    }
  }

  const averageDivergence =
    audits.reduce((sum, a) => sum + a.divergenceScore, 0) / audits.length

  const highDivergenceCount = audits.filter(
    (a) => a.divergenceScore >= 0.6
  ).length

  const intentDriftRate =
    audits.filter((a) => a.intentChanged).length / audits.length

  const grouped = new Map<
    string,
    { count: number; divergence: number; intentChanged: number }
  >()

  for (const audit of audits) {
    const key = audit.originalIntent
    const current = grouped.get(key) ?? {
      count: 0,
      divergence: 0,
      intentChanged: 0,
    }

    current.count += 1
    current.divergence += audit.divergenceScore
    if (audit.intentChanged) current.intentChanged += 1

    grouped.set(key, current)
  }

  const byIntent = Array.from(grouped.entries()).map(([intent, g]) => ({
    intent,
    averageDivergence: g.divergence / g.count,
    count: g.count,
    intentChangedRate: g.intentChanged / g.count,
  }))

  byIntent.sort((a, b) => b.averageDivergence - a.averageDivergence)

  return {
    averageDivergence,
    highDivergenceCount,
    intentDriftRate,
    mostUnstableIntent: byIntent[0]?.intent ?? null,
    byIntent,
  }
}