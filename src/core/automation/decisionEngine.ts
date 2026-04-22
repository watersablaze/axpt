type OperatorSignal = {
  operatorId: string
  archetype: string
  confidence: number
  decision: "APPROVE" | "DELAY" | "OVERRIDE"
}

export function computeWeightedDecision(signals: OperatorSignal[]) {
  let score = 0

  for (const s of signals) {
    const weight =
      s.archetype === "GUARDIAN" ? 1.3 :
      s.archetype === "EXECUTOR" ? 1.1 :
      s.archetype === "ANALYST" ? 1.2 :
      1

    const decisionValue =
      s.decision === "APPROVE" ? 1 :
      s.decision === "DELAY" ? 0 :
      -1

    score += decisionValue * s.confidence * weight
  }

  if (score > 0.5) return "APPROVE"
  if (score < -0.5) return "OVERRIDE"
  return "DELAY"
}