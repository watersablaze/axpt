import { prisma } from '@/infrastructure/db/prisma'
import { computeImpactScore } from '@/domains/learning/impactScoring'
import { updateIntentWeights } from '@/domains/learning/intentWeights'
import { deriveSystemState } from '@/domains/learning/systemState'
import { executeIntent } from '@/domains/intent/intentExecutor'
import { readSystemState } from '@/domains/intent/systemState'
import type { IntentType } from '@/domains/intent/intentTypes'
import type { PlannedAction } from '@/domains/intent/intentPlanner'

type ExecuteArgs = {
  intent: IntentType
  scenarioId: string
  actions: PlannedAction[]
  context?: any
}

export async function executeStrategy(args: ExecuteArgs) {
  const { intent, scenarioId, actions, context } = args

  // --- Snapshot BEFORE ---
  const before = await readSystemState()

  // --- Execute actions ---
  await executeIntent(intent, actions)

  // --- Snapshot AFTER ---
  const after = await readSystemState()

  // --- Compute impact ---
  const impactScore = computeImpactScore({
    mismatchesBefore: before.mismatchCount,
    mismatchesAfter: after.mismatchCount,
    deadLettersBefore: before.deadLetterCount,
    deadLettersAfter: after.deadLetterCount,
    syncLagBefore: before.syncLagSeconds ?? 0,
    syncLagAfter: after.syncLagSeconds ?? 0,
  })

  const success = impactScore > 0

  // --- Record outcome ---
  await prisma.strategyOutcome.create({
    data: {
      intent,
      scenarioId,
      assetCode: context?.assetCode ?? null,
      confidence: context?.confidence ?? 0.7,
      success,
      impactScore,
    },
  })

  // --- Update intent weights ---
  await updateIntentWeights({
    intent,
    assetCode: context?.assetCode,
    systemState: deriveSystemState({
      mismatches: before.mismatchCount,
      deadLetters: before.deadLetterCount,
      syncLag: before.syncLagSeconds ?? 0,
    }),
    success,
    impactScore,
  })

  return {
    success,
    impactScore,
  }
}
