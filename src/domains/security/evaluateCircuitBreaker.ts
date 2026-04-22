export type CircuitBreakerState = {
  triggered: boolean
  level: 'NONE' | 'ELEVATED' | 'CRITICAL'
  reason?: string
}

export function evaluateCircuitBreaker(pressure: {
  pressureScore: number
  mode: string
}): CircuitBreakerState {
  if (pressure.mode === 'LOCKDOWN' || pressure.pressureScore > 25) {
    return {
      triggered: true,
      level: 'CRITICAL',
      reason: 'Critical system pressure',
    }
  }

  if (pressure.mode === 'DEFENSIVE' || pressure.pressureScore > 15) {
    return {
      triggered: true,
      level: 'ELEVATED',
      reason: 'Elevated system stress',
    }
  }

  return {
    triggered: false,
    level: 'NONE',
  }
}