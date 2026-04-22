export type Intervention = {
  level: "INFO" | "WARNING" | "CRITICAL"
  message: string
  reason: string
  suggestedAction?: string
}

type InterventionInput = {
  status: string
  automationEnabled: boolean
  cooldown: boolean
  actions: string[]
  reason: string
  nextAction: string
}

export function getInterventionSignals(
  item: InterventionInput
): Intervention[] {
  const signals: Intervention[] = []

  // BLOCKED FLOW
  if (item.nextAction === "AWAITING_GATES") {
    signals.push({
      level: "WARNING",
      message: "System is blocked — no gates defined",
      reason: "Cannot proceed without verification structure",
      suggestedAction: "Create verification gates",
    })
  }

  // AUTOMATION OFF BUT SHOULD ACT
  if (!item.automationEnabled && item.actions.length > 0) {
    signals.push({
      level: "INFO",
      message: "Automation is OFF but actions are available",
      reason: "System is waiting for manual intervention",
      suggestedAction: "Enable automation or execute action",
    })
  }

  // ESCALATION READY
  if (item.nextAction === "ESCALATE_CASE" && !item.cooldown) {
    signals.push({
      level: "CRITICAL",
      message: "Case overdue — escalation imminent",
      reason: "Time threshold exceeded",
      suggestedAction: "Review case immediately",
    })
  }

  // COOLDOWN HOLD
  if (item.cooldown) {
    signals.push({
      level: "INFO",
      message: "System is in cooldown",
      reason: "Recently escalated — preventing duplicate action",
    })
  }

  return signals
}