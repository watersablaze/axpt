import { computeTimeDecayWeight } from './timeDecay'

export function detectDrift(entries: {
  success: boolean
  impactScore: number
  createdAt: Date
}[]) {
  let recentWeight = 0
  let historicalWeight = 0

  let recentSuccess = 0
  let historicalSuccess = 0

  for (const e of entries) {
    const decay = computeTimeDecayWeight(e.createdAt)

    // split horizon
    const isRecent = decay > 0.7

    if (isRecent) {
      recentWeight += decay
      if (e.success) recentSuccess += decay
    } else {
      historicalWeight += decay
      if (e.success) historicalSuccess += decay
    }
  }

  const recentRate =
    recentWeight > 0 ? recentSuccess / recentWeight : 0

  const historicalRate =
    historicalWeight > 0 ? historicalSuccess / historicalWeight : 0

  const drift = historicalRate - recentRate

  return {
    driftScore: drift,
    isDrifting: drift > 0.2,
    recentRate,
    historicalRate,
  }
}