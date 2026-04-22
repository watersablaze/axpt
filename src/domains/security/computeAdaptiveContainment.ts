type AdaptiveContainmentResult = {
  shouldQuarantine: boolean
  severity: number
  reason: string[]
}

export function computeAdaptiveContainment(params: {
  riskScore: number
  anomalyScore: number
  clusterRisk?: number
  recentFailures?: number
}): AdaptiveContainmentResult {
  const {
    riskScore,
    anomalyScore,
    clusterRisk = 0,
    recentFailures = 0,
  } = params

  let severity = 0
  const reasons: string[] = []

  if (riskScore > 7) {
    severity += 3
    reasons.push('HIGH_RISK_SCORE')
  }

  if (anomalyScore > 0.7) {
    severity += 3
    reasons.push('HIGH_ANOMALY')
  }

  if (clusterRisk > 6) {
    severity += 2
    reasons.push('CLUSTER_RISK')
  }

  if (recentFailures > 2) {
    severity += 2
    reasons.push('REPEATED_FAILURES')
  }

  return {
    shouldQuarantine: severity >= 5,
    severity,
    reason: reasons,
  }
}