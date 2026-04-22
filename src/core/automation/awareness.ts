type Operator = {
  operatorId: string
  archetype: string
  decision?: string
}

type Hierarchy = {
  operatorId: string
  power: number
  tier: string
}

type Momentum = {
  operatorId: string
  velocity: number
  signal: string
}

type Context = {
  status: string
  confidence: number
}

export function generateAwarenessAlerts({
  operators,
  hierarchy,
  momentum,
  context,
}: {
  operators: Operator[]
  hierarchy?: Hierarchy[]
  momentum?: Momentum[]
  context: Context
}) {
  const alerts: {
    level: "INFO" | "WARNING" | "CRITICAL"
    message: string
  }[] = []

  // =========================
  // 1. MISSING GUARDIAN IN DISPUTE
  // =========================
  if (context.status === "ESCROW_DISPUTED") {
    const guardian = operators.find(o => o.archetype === "GUARDIAN")

    if (!guardian || !guardian.decision) {
      alerts.push({
        level: "CRITICAL",
        message: "Guardian not engaged in dispute",
      })
    }
  }

  // =========================
  // 2. EXECUTOR DOMINANCE WITHOUT SUPPORT
  // =========================
  const executor = operators.find(o => o.archetype === "EXECUTOR")

  if (executor?.decision === "APPROVE") {
    const others = operators.filter(o => o.operatorId !== executor.operatorId)

    const noSupport = others.every(o => !o.decision)

    if (noSupport) {
      alerts.push({
        level: "WARNING",
        message: "Executor acting without council alignment",
      })
    }
  }

  // =========================
  // 3. MOMENTUM DIVERGENCE
  // =========================
  if (momentum && momentum.length > 1) {
    const velocities = momentum.map(m => m.velocity)

    const hasPositive = velocities.some(v => v > 0.2)
    const hasNegative = velocities.some(v => v < -0.2)

    if (hasPositive && hasNegative) {
      alerts.push({
        level: "WARNING",
        message: "Momentum divergence detected",
      })
    }
  }

  // =========================
  // 4. LOW CONFIDENCE STALL
  // =========================
  if (context.confidence < 0.4) {
    alerts.push({
      level: "INFO",
      message: "Low confidence — system indecisive",
    })
  }

  return alerts
}