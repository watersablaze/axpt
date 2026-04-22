import type { ScenarioHistoryStats } from './strategyLearning'

export type ImpactScoreArgs = {
  mismatchesBefore: number
  mismatchesAfter: number
  deadLettersBefore: number
  deadLettersAfter: number
  syncLagBefore: number
  syncLagAfter: number
}

export function computeImpactScore(args: ImpactScoreArgs) {
  let score = 0

  if (args.mismatchesAfter < args.mismatchesBefore) score += 0.4
  if (args.deadLettersAfter < args.deadLettersBefore) score += 0.3
  if (args.syncLagAfter < args.syncLagBefore) score += 0.3

  if (args.mismatchesAfter > args.mismatchesBefore) score -= 0.4
  if (args.deadLettersAfter > args.deadLettersBefore) score -= 0.3
  if (args.syncLagAfter > args.syncLagBefore) score -= 0.3

  return Math.max(-1, Math.min(1, score))
}

export function applyLearningAdjustment(args: {
  baseScore: number
  history?: ScenarioHistoryStats
}) {
  const { baseScore, history } = args

  if (!history) {
    return {
      finalScore: baseScore,
      learningDelta: 0,
      learningReasoning: ['No history available'],
    }
  }

  const successBonus = history.successRate * 0.3
  const impactBonus = history.averageImpact * 0.2
  const weightedDelta = (successBonus + impactBonus) * history.confidenceWeight

  return {
    finalScore: baseScore + weightedDelta,
    learningDelta: weightedDelta,
    learningReasoning: [
      `History samples: ${history.sampleCount}`,
      `Success rate bonus: ${successBonus.toFixed(2)}`,
      `Impact bonus: ${impactBonus.toFixed(2)}`,
      `History confidence weight: ${history.confidenceWeight.toFixed(2)}`,
      `Learning delta: ${weightedDelta.toFixed(2)}`,
    ],
  }
}
