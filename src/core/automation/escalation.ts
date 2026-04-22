// src/core/automation/escalation.ts

type GlobalAwareness = {
  severity: number
  dominantMode: string
  requiresHumanAttention: boolean
  metrics: {
    disputeCount: number
    lowConfidence: number
    totalAlerts: number
  }
}

export type EscalationLevel =
  | "STABLE"
  | "DEGRADED"
  | "CRITICAL"

export function computeEscalation(
  awareness: GlobalAwareness
) {
  let level: EscalationLevel = "STABLE"

  if (
    awareness.metrics.disputeCount > 0 ||
    awareness.severity > 0.7
  ) {
    level = "CRITICAL"
  } else if (
    awareness.severity > 0.4 ||
    awareness.metrics.lowConfidence > 2
  ) {
    level = "DEGRADED"
  }

  return {
    level,

    effects: {
      allowAutomation: level === "STABLE",
      requireHuman: level === "CRITICAL",
      slowDecisions: level === "DEGRADED",
    },
  }
}