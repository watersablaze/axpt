type CaseInput = {
  council?: {
    confidence: number
  }
  alerts?: {
    level: "INFO" | "WARNING" | "CRITICAL"
  }[]
}

export function computeMetaAwareness(cases: CaseInput[]) {
  if (!cases || cases.length === 0) {
    return {
      metaState: "IDLE",
      avgConfidence: 1,
      instability: 0,
    }
  }

  // =========================
  // AVERAGE CONFIDENCE
  // =========================
  const avgConfidence =
    cases.reduce((sum, c) => sum + (c.council?.confidence ?? 1), 0) /
    cases.length

  // =========================
  // ALERT PRESSURE
  // =========================
  let criticalCount = 0

  cases.forEach((c) => {
    const alerts = c.alerts ?? []
    alerts.forEach((a) => {
      if (a.level === "CRITICAL") criticalCount++
    })
  })

  // =========================
  // INSTABILITY SCORE
  // =========================
  const instability =
    (1 - avgConfidence) * 0.6 +
    Math.min(criticalCount / 10, 1) * 0.4

  // =========================
  // META STATE
  // =========================
  let metaState = "STABLE"

  if (instability > 0.7) metaState = "SYSTEM_FAILURE"
  else if (instability > 0.45) metaState = "DEGRADING"
  else if (avgConfidence < 0.6) metaState = "LOW_CONFIDENCE"

  return {
    metaState,
    avgConfidence,
    instability,
  }
}