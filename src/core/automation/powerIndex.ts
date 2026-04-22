// src/core/automation/powerIndex.ts

import { computeDistrustFactor } from "@/core/automation/distrust"

export type PowerOperatorInput = {
  operatorId: string
  successRate?: number
  trustScore?: number
  influenceScore?: number
  respectScore?: number
  decision?: string
}

export function computePowerIndex(
  operators: PowerOperatorInput[]
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const op of operators) {
    const reputation = op.successRate ?? 1
    const trust = op.trustScore ?? 1
    const influence = op.influenceScore ?? 1
    const respect = op.respectScore ?? 1
    const participation = op.decision ? 1.05 : 1

    const distrust = computeDistrustFactor({
    successRate: op.successRate,
    trustScore: op.trustScore,
    })

    const power =
    (
        reputation * 0.6 +
        trust * 0.2 +
        influence * 0.1 +
        respect * 0.1
    ) * participation

    result[op.operatorId] = power * distrust
    }
  

  return result
}