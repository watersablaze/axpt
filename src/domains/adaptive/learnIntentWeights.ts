import { prisma } from '@/infrastructure/db/prisma'

export async function learnIntentWeights() {
  const outcomes = await prisma.decisionExplanation.findMany({
    take: 200,
  })

  const map: Record<string, { success: number; total: number }> = {}

  for (const o of outcomes) {
    const intent = o.intent

    if (!map[intent]) {
      map[intent] = { success: 0, total: 0 }
    }

    map[intent].total++

    if (o.summary.includes('success')) {
      map[intent].success++
    }
  }

  const weights: Record<string, number> = {}

  for (const intent in map) {
    const { success, total } = map[intent]

    weights[intent] = success / Math.max(total, 1)
  }

  return weights
}