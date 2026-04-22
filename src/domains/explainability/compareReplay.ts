import { prisma } from '@/infrastructure/db/prisma'
import { replayDecision } from './replayDecision'

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

export async function compareReplay(decisionId: string) {
  const original = await prisma.decisionExplanation.findUnique({
    where: { id: decisionId },
  })

  if (!original) {
    throw new Error('Original decision explanation not found')
  }

  const replay = await replayDecision(decisionId)

  const originalFactors = asStringArray(original.factors)
  const replayResult = replay.replay
  const replayFactors = [
    ...(replayResult.actions ?? []).map((action) =>
      `${action.type}: ${action.willExecute ? 'will execute' : 'blocked'}`
    ),
    ...(replayResult.effects ?? []).map((effect) => effect.description),
    ...(replayResult.risks ?? []).map(
      (risk) => `${risk.level} risk: ${risk.message}`
    ),
  ]

  const removed = originalFactors.filter((f) => !replayFactors.includes(f))
  const added = replayFactors.filter((f) => !originalFactors.includes(f))

  const originalIntent = original.intent
  const replayIntent = replay.replay?.intent ?? original.intent

  return {
    original: {
      id: original.id,
      intent: originalIntent,
      scenarioId: original.scenarioId,
      summary: original.summary,
      factors: originalFactors,
      createdAt: original.createdAt.toISOString(),
    },
    replay: {
      ...replayResult,
      summary: `Replay simulation for ${replayResult.intent}`,
      factors: replayFactors,
    },
    diff: {
      intentChanged: originalIntent !== replayIntent,
      addedFactors: added,
      removedFactors: removed,
    },
  }
}
