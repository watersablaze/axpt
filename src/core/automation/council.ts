// src/core/automation/council.ts

import { computePowerIndex } from "@/core/automation/powerIndex"
import { computeSystemTrust } from "./systemTrust"

export type OperatorDecision = "APPROVE" | "DELAY" | "OVERRIDE"

export type OperatorInput = {
  operatorId: string
  archetype: string
  decision?: OperatorDecision
  successRate?: number
  trustScore?: number
  influenceScore?: number
  respectScore?: number
}

export type Prediction = {
  systemBias: OperatorDecision | null
  urgencyScore: number
  reason: string
  hoursOpen?: number
  hoursInEscrow?: number
  cooldown?: boolean
}

export type CouncilResult = {
  finalDecision: OperatorDecision | null
  confidence: number
  breakdown: Record<OperatorDecision, number>
  reason: string
  signals: {
    human: number
    system: number
  }
}

export function resolveCouncil(
  operators: OperatorInput[],
  prediction?: Prediction,
  coalition?: Record<string, number>
): CouncilResult {

  const tally: Record<OperatorDecision, number> = {
    APPROVE: 0,
    DELAY: 0,
    OVERRIDE: 0,
  }

  let humanWeight = 0
  let systemWeight = 0

  // =========================
  // SYSTEM SIGNAL
  // =========================
  if (prediction?.systemBias) {
    const weight = prediction.urgencyScore * 1.2
    tally[prediction.systemBias] += weight
    systemWeight += weight
  }

  // =========================
  // POWER INDEX
  // =========================
  const powerIndexMap = computePowerIndex(operators)

  // =========================
  // HUMAN SIGNALS
  // =========================
  for (const op of operators) {
    if (!op.decision) continue

    const archetypeWeight =
      op.archetype === "GUARDIAN" ? 1.4 :
      op.archetype === "ANALYST" ? 1.1 :
      1.0

    const decisionWeight =
      op.decision === "OVERRIDE" ? 1.3 :
      op.decision === "DELAY" ? 0.7 :
      1.0

    const power = powerIndexMap[op.operatorId] ?? 1

    const weight = archetypeWeight * decisionWeight * power

    tally[op.decision] += weight
    humanWeight += weight
  }

  // =========================
  // COALITION BOOST
  // =========================
  if (coalition) {
    for (const d of ["APPROVE","DELAY","OVERRIDE"] as OperatorDecision[]) {
      const p = coalition[d] || 0
      if (p > 0.6) tally[d] *= 1.1
      if (p > 0.75) tally[d] *= 1.2
    }
  }

  const total =
    tally.APPROVE + tally.DELAY + tally.OVERRIDE

  if (total === 0) {
    return {
      finalDecision: null,
      confidence: 0,
      breakdown: tally,
      reason: "No signals",
      signals: { human: 0, system: 0 },
    }
  }

  // =========================
  // BREAKDOWN
  // =========================
  const breakdown: Record<OperatorDecision, number> = {
    APPROVE: tally.APPROVE / total,
    DELAY: tally.DELAY / total,
    OVERRIDE: tally.OVERRIDE / total,
  }

  // =========================
  // DECISION
  // =========================
  const sorted = Object.entries(tally).sort(
    (a, b) => b[1] - a[1]
  ) as [OperatorDecision, number][]

  let [decision, score] = sorted[0]

  let confidence = score / total

  // =========================
  // CONFLICT
  // =========================
  const second = sorted[1]?.[1] ?? 0
  const conflictRatio = second / (score || 1)

  if (conflictRatio > 0.7) {
    decision = tally.OVERRIDE > tally.APPROVE ? "OVERRIDE" : "DELAY"
    confidence = Math.max(confidence, 0.72)
  }

  // =========================
  // TIME DECAY
  // =========================
  if (prediction?.hoursOpen) {
    if (prediction.hoursOpen > 24) confidence *= 0.95
    if (prediction.hoursOpen > 72) confidence *= 0.9
  }

  if (prediction?.cooldown) {
    confidence *= 0.9
  }

  // =========================
  // SYSTEM DISTRUST
  // =========================
  const trust = computeSystemTrust({ operators })

  if (trust.trustLevel === "DEGRADED") {
    confidence *= 0.85
  }

  if (trust.trustLevel === "UNTRUSTED") {
    confidence *= 0.65
  }

  confidence = Math.max(0, Math.min(1, confidence))

  return {
    finalDecision: decision,
    confidence,
    breakdown,
    reason: `Consensus: ${decision}`,
    signals: {
      human: humanWeight,
      system: systemWeight,
    },
  }
}