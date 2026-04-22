export function generateTone({
  archetype,
  confidence,
  willAct,
}: {
  archetype: string
  confidence: number
  willAct: boolean
}) {
  if (!archetype) return "I am observing."

  if (archetype === "EXECUTOR") {
    return willAct
      ? "I am ready to execute immediately."
      : "Awaiting final signal to proceed."
  }

  if (archetype === "GUARDIAN") {
    return "Risk conditions detected. Proceed with caution."
  }

  if (archetype === "ANALYST") {
    return confidence > 0.7
      ? "Data supports forward action."
      : "Insufficient confidence. Awaiting clarity."
  }

  if (archetype === "DIPLOMAT") {
    return "Human alignment required before proceeding."
  }

  return "Monitoring system state."
}