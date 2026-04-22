import { computeSystemPressure } from './computeSystemPressure'
import { computeGlobalThrottle } from './computeGlobalThrottle'
import { evaluateCircuitBreaker } from './evaluateCircuitBreaker'
import { triggerAutoLockdown } from './triggerAutoLockdown'

type SystemSecurityState = {
  pressure: Awaited<ReturnType<typeof computeSystemPressure>>
  throttle: ReturnType<typeof computeGlobalThrottle>
  breaker: ReturnType<typeof evaluateCircuitBreaker> // ✅ ADD THIS
}

let cached: SystemSecurityState | null = null
let lastUpdated = 0

export async function getSystemSecurityState(): Promise<SystemSecurityState> {
  const now = Date.now()

  if (cached && now - lastUpdated < 3000) {
    return cached
  }

  const pressure = await computeSystemPressure()
  const throttle = computeGlobalThrottle(pressure)
  const breaker = evaluateCircuitBreaker(pressure)

  if (breaker.triggered) {
    await triggerAutoLockdown(breaker)
  }

  cached = {
    pressure,
    throttle,
    breaker, // ✅ now valid
  }

  lastUpdated = now

  return cached
}