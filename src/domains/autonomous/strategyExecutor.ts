import { prisma } from '@/infrastructure/db/prisma'
import { readSystemState } from '@/domains/intent/systemState'
import { computeImpactScore } from '@/domains/learning/outcomeScoring'

export async function executeStrategy(
  intent: string,
  best: any,
  confidence: number,
  context?: { assetCode?: string }
) {
  const assetCode = context?.assetCode ?? null
  const beforeState = await readSystemState()

  const response = await fetch('/api/admin/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent,
      scenarioId: best.id,
    }),
  })

  const data = await response.json()

  if (response.ok && data.success) {
    const afterState = await readSystemState()
    const impactScore = computeImpactScore({
      mismatchesBefore: beforeState.mismatchCount,
      mismatchesAfter: afterState.mismatchCount,
      deadLettersBefore: beforeState.deadLetterCount,
      deadLettersAfter: afterState.deadLetterCount,
      syncLagBefore: beforeState.syncLagSeconds ?? 0,
      syncLagAfter: afterState.syncLagSeconds ?? 0,
    })

    // Record outcome after successful execution
    await prisma.strategyOutcome.create({
      data: {
        intent,
        scenarioId: best.id,
        assetCode,
        confidence,
        success: true,
        impactScore,
      },
    })
  } else {
    // Record failed outcome
    await prisma.strategyOutcome.create({
      data: {
        intent,
        scenarioId: best.id,
        assetCode,
        confidence,
        success: false,
        impactScore: 0,
      },
    })
  }

  return data
}
