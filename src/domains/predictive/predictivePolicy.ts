import type {
  PredictiveRecommendation,
  PredictiveSignal,
} from './predictiveTypes'

export function buildPredictiveRecommendations(
  signals: PredictiveSignal[]
): PredictiveRecommendation[] {
  const recommendations = new Map<string, PredictiveRecommendation>()

  function addRecommendation(recommendation: PredictiveRecommendation) {
    const key = `${recommendation.intent}:${recommendation.assetCode ?? 'GLOBAL'}`
    const existing = recommendations.get(key)

    if (!existing) {
      recommendations.set(key, recommendation)
      return
    }

    recommendations.set(key, {
      ...existing,
      autoRunnable: existing.autoRunnable && recommendation.autoRunnable,
      reason: `${existing.reason}; ${recommendation.reason}`,
    })
  }

  const hasCriticalDeadLetter = signals.some(
    (s) => s.type === 'DEAD_LETTER_PRESENT' && s.severity === 'CRITICAL'
  )

  const hasSyncLag = signals.some(
    (s) => s.type === 'SYNC_LAG_RISING'
  )

  const hasReconInstability = signals.some(
    (s) => s.type === 'RECON_INSTABILITY'
  )

  if (hasSyncLag) {
    addRecommendation({
      intent: 'STABILIZE_SYSTEM',
      reason: 'Sync lag suggests mirror state may be drifting',
      autoRunnable: true,
    })
  }

  if (hasReconInstability) {
    addRecommendation({
      intent: 'STABILIZE_SYSTEM',
      reason: 'Repeated reconciliation warnings detected',
      autoRunnable: true,
    })
  }

  if (hasCriticalDeadLetter) {
    addRecommendation({
      intent: 'STABILIZE_SYSTEM',
      reason: 'Dead-letter state requires intervention',
      autoRunnable: false,
    })
  }

  for (const signal of signals) {
    if (signal.type === 'ASSET_STRESS' && signal.assetCode) {
      addRecommendation({
        intent: 'STABILIZE_SYSTEM',
        reason: `Stress concentrated in ${signal.assetCode}`,
        autoRunnable: false,
        assetCode: signal.assetCode,
      })
    }
  }

  return Array.from(recommendations.values())
}

export function scoreConfidence(signals: PredictiveSignal[]): number {
  let score = 0

  for (const signal of signals) {
    if (signal.severity === 'CRITICAL') score += 0.5
    else if (signal.severity === 'WARN') score += 0.25
  }

  return Math.min(score, 1)
}
