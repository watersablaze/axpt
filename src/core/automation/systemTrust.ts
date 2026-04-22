type Input = {
  operators: {
    successRate?: number
    trustScore?: number
  }[]
}

export function computeSystemTrust(input: Input) {
  let weakOperators = 0

  input.operators.forEach((op) => {
    const reputation = op.successRate ?? 1
    const trust = op.trustScore ?? 1

    if (reputation < 0.6 || trust < 0.7) {
      weakOperators++
    }
  })

  const ratio = weakOperators / (input.operators.length || 1)

  let trustLevel = "HEALTHY"

  if (ratio > 0.5) trustLevel = "DEGRADED"
  if (ratio > 0.75) trustLevel = "UNTRUSTED"

  return {
    ratio,
    trustLevel,
  }
}