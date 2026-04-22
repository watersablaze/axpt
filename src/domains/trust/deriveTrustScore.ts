import type { UserTrustState, UserTrustScore } from './trustTypes'

export function deriveTrustScore(
  state: UserTrustState
): UserTrustScore {
  let score = 50 // neutral baseline

  // ✅ Reward consistency
  score += state.successRate * 40

  // ❌ Penalize failures harder
  score -= state.failureRate * 50

  // ⚖️ Penalize risk exposure
  score -= state.avgRisk * 2

  // Clamp
  score = Math.max(0, Math.min(100, score))

  let tier: UserTrustScore['tier'] = 'MEDIUM'

  if (score >= 85) tier = 'ELITE'
  else if (score >= 70) tier = 'HIGH'
  else if (score >= 40) tier = 'MEDIUM'
  else tier = 'LOW'

  return {
    score,
    tier,
  }
}