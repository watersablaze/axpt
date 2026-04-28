import { prisma } from '@/infrastructure/db/prisma'

type ReplayAuditSummaryRow = {
  originalIntent: string
  intentChanged: boolean
  divergenceScore: number
}

type IntentDriftSummary = {
  intent: string
  averageDivergence: number
  count: number
  intentChangedRate: number
}

export async function getReplayDriftSummary() {
  const audits = await prisma.replayAudit.findMany({
    select: {
      originalIntent: true,
      intentChanged: true,
      divergenceScore: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  }) as ReplayAuditSummaryRow[]

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
    audits.reduce(
      (sum: number, audit: ReplayAuditSummaryRow) =>
        sum + audit.divergenceScore,
      0
    ) /
    audits.length

  const highDivergenceCount = audits.filter(
    (audit: ReplayAuditSummaryRow) => audit.divergenceScore >= 0.6
  ).length

  const intentDriftRate =
    audits.filter(
      (audit: ReplayAuditSummaryRow) => audit.intentChanged
    ).length / audits.length

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

  const byIntent: IntentDriftSummary[] = Array.from(
    grouped.entries()
  ).map(([intent, group]) => ({
    intent,
    averageDivergence: group.divergence / group.count,
    count: group.count,
    intentChangedRate: group.intentChanged / group.count,
  }))

  byIntent.sort(
    (left: IntentDriftSummary, right: IntentDriftSummary) =>
      right.averageDivergence - left.averageDivergence
  )

  return {
    averageDivergence,
    highDivergenceCount,
    intentDriftRate,
    mostUnstableIntent: byIntent[0]?.intent ?? null,
    byIntent,
  }
}
