type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN"

/**
 * 🚨 SYSTEM CIRCUIT BREAKER
 */
export class CircuitBreaker {

  private state: BreakerState = "CLOSED"
  private failureCount = 0
  private threshold = 5
  private cooldown = 10_000
  private lastOpenedAt = 0

  /**
   * ⚡ EXECUTION CHECK
   */
  allowExecution(): boolean {

    if (this.state === "OPEN") {
      const now = Date.now()

      if (now - this.lastOpenedAt > this.cooldown) {
        this.state = "HALF_OPEN"
        return true
      }

      return false
    }

    return true
  }

  /**
   * ❌ RECORD FAILURE
   */
  recordFailure() {
    this.failureCount++

    if (this.failureCount >= this.threshold) {
      this.trip()
    }
  }

  /**
   * ✅ RECORD SUCCESS
   */
  recordSuccess() {
    this.failureCount = 0

    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED"
    }
  }

  /**
   * 🔴 TRIP BREAKER
   */
  private trip() {
    this.state = "OPEN"
    this.lastOpenedAt = Date.now()
  }

  getState() {
    return this.state
  }
}

/**
 * 🧬 SINGLETON
 */
export const circuitBreaker = new CircuitBreaker()