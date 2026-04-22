import { classifyRisk } from './classifyRisk'

export function computeDynamicTransferCapacity(params: {
  riskScore: number
  baseCapacity: number
}) {
  const { riskScore, baseCapacity } = params

  const riskLevel = classifyRisk(riskScore)

  if (riskLevel === 'LOW') {
    return {
      riskLevel,
      effectiveCapacity: baseCapacity,
      throttleMultiplier: 1,
      cooldownMs: 0,
    }
  }

  if (riskLevel === 'MEDIUM') {
    return {
      riskLevel,
      effectiveCapacity: Math.max(2, Math.floor(baseCapacity * 0.6)),
      throttleMultiplier: 1.5,
      cooldownMs: 30_000,
    }
  }

  return {
    riskLevel,
    effectiveCapacity: Math.max(1, Math.floor(baseCapacity * 0.3)),
    throttleMultiplier: 2.5,
    cooldownMs: 5 * 60_000,
  }
}