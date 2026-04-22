type Prediction = {
  systemBias: "APPROVE" | "DELAY" | "OVERRIDE" | null
  urgencyScore: number
  reason: string
}

type Context = {
  allVerified: boolean
  hoursOpen: number
  hoursInEscrow?: number
  cooldown: boolean
  pendingGates: number
}

export function predictFuture(context: Context): Prediction {
  const {
    allVerified,
    hoursOpen,
    hoursInEscrow = 0,
    cooldown,
    pendingGates,
  } = context

  let systemBias: Prediction["systemBias"] = null
  let urgencyScore = 0
  let reason = "Neutral state"

  // =========================
  // 🔥 ESCROW TEMPORAL PRESSURE
  // =========================
  if (hoursInEscrow > 0) {
    if (hoursInEscrow > 24) {
      systemBias = "OVERRIDE"
      urgencyScore += 0.9
      reason = "Escrow held too long → escalation required"
    } else if (hoursInEscrow > 12) {
      systemBias = "APPROVE"
      urgencyScore += 0.7
      reason = "Extended hold → push toward release"
    } else if (hoursInEscrow > 2) {
      systemBias = "DELAY"
      urgencyScore += 0.5
      reason = "Recent hold → allow time"
    }
  }

  // =========================
  // GENERAL TIME PRESSURE
  // =========================
  if (hoursOpen > 48) {
    urgencyScore += 0.6
  } else if (hoursOpen > 24) {
    urgencyScore += 0.4
  }

  // =========================
  // BLOCKERS
  // =========================
  if (!allVerified || pendingGates > 0) {
    systemBias = "DELAY"
    reason = "Verification incomplete"
  }

  if (cooldown) {
    systemBias = "DELAY"
    reason = "Cooldown active"
  }

  return {
    systemBias,
    urgencyScore,
    reason,
  }
}