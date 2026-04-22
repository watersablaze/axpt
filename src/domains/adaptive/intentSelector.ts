import { prisma } from '@/infrastructure/db/prisma'
import { extractSystemPattern } from './patternMatcher'
import type { IntentType } from '@/domains/intent/intentTypes'
import { getIntentWeights } from '@/domains/learning/intentWeights'
import { deriveSystemState } from '@/domains/learning/systemState'
import { computeTimeDecayWeight } from '@/domains/learning/timeDecay'
import { detectDrift } from '@/domains/learning/driftDetection'

const ADAPTIVE_INTENTS: IntentType[] = [
  'STABILIZE_SYSTEM',
  'PREPARE_SETTLEMENT',
  'RESUME_SAFE',
]

type IntentScore = {
  intent: IntentType
  score: number
  reasoning: string[]
  assetCode?: string
  systemState: string
  weights: {
    successWeight: number
    impactWeight: number
    patternWeight: number
  }
}

export async function selectBestIntent(currentState: {
  mismatches: number
  deadLetters: number
  syncLag: number
  assetCode?: string
}): Promise<IntentScore[]> {
  const pattern = extractSystemPattern(currentState)
  const systemState = deriveSystemState(currentState)

  const outcomes = await prisma.strategyOutcome.findMany({
    select: {
      intent: true,
      success: true,
      impactScore: true,
      createdAt: true, // 🔥 REQUIRED for time decay
    },
  })

  const grouped = new Map<
    IntentType,
    {
      entries: {
        success: boolean
        impactScore: number
        createdAt: Date
      }[]
      weightedSuccess: number
      weightedImpact: number
      totalWeight: number
    }
  >()

  // 🔥 TIME-DECAY AGGREGATION
  for (const o of outcomes) {
    const intent = o.intent as IntentType
    if (!ADAPTIVE_INTENTS.includes(intent)) continue

    const weight = computeTimeDecayWeight(o.createdAt)

    const g = grouped.get(intent) ?? {
      entries: [],
      weightedSuccess: 0,
      weightedImpact: 0,
      totalWeight: 0,
    }

    g.entries.push({
      success: o.success,
      impactScore: o.impactScore ?? 0,
      createdAt: o.createdAt,
    })
    g.totalWeight += weight

    if (o.success) {
      g.weightedSuccess += weight
    }

    g.weightedImpact += (o.impactScore ?? 0) * weight

    grouped.set(intent, g)
  }

  const results: IntentScore[] = []

  for (const intent of ADAPTIVE_INTENTS) {
    const g = grouped.get(intent)

    const weights = await getIntentWeights({
      intent,
      assetCode: currentState.assetCode,
      systemState,
    })

    const patternWeight = Math.min(weights.patternWeight, 0.4)

    // 🔒 SAFE FALLBACKS
    const totalWeight = g?.totalWeight ?? 0

    const successRate =
      totalWeight > 0 ? (g?.weightedSuccess ?? 0) / totalWeight : 0

    const avgImpact =
      totalWeight > 0 ? (g?.weightedImpact ?? 0) / totalWeight : 0
    const drift = detectDrift(g?.entries ?? [])

    // 🔍 Pattern scoring
    let patternScore = 0

    if (pattern.mismatchLevel === 'HIGH' && intent === 'STABILIZE_SYSTEM') {
      patternScore = 1
    }

    if (
      pattern.deadLetterLevel === 'HIGH' &&
      intent === 'PREPARE_SETTLEMENT'
    ) {
      patternScore = 0.8
    }

    // Mild penalty when recent performance is materially worse than history.
    const driftPenalty = drift.isDrifting
      ? Math.min(drift.driftScore, 0.4) * 0.25
      : 0

    const score =
      successRate * weights.successWeight +
      avgImpact * weights.impactWeight +
      patternScore * patternWeight -
      driftPenalty

    const reasoning = [
      `Context → ${currentState.assetCode ?? 'GLOBAL'} / ${systemState}`,
      `Weights → S:${weights.successWeight.toFixed(2)} I:${weights.impactWeight.toFixed(2)} P:${patternWeight.toFixed(2)}`,
      `Success (decayed): ${(successRate * 100).toFixed(0)}%`,
      `Impact (decayed): ${avgImpact.toFixed(2)}`,
      `Pattern: ${patternScore.toFixed(2)}`,
      `Effective weight: ${totalWeight.toFixed(2)}`,
      `Drift: ${drift.driftScore.toFixed(2)} (${drift.isDrifting ? 'penalized' : 'stable'})`,
    ]

    results.push({
      intent,
      score,
      reasoning,
      assetCode: currentState.assetCode,
      systemState,
      weights: {
        successWeight: weights.successWeight,
        impactWeight: weights.impactWeight,
        patternWeight,
      },
    })
  }

  return results.sort((a, b) => b.score - a.score)
}
