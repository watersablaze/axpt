export type CircuitState =
  | 'NORMAL'
  | 'DEGRADED'
  | 'ESCROW_ONLY'
  | 'READ_ONLY'
  | 'LOCKDOWN'

export class AXPTCircuitBreakerEngine {
  private state: CircuitState = 'NORMAL'

  private failureCount = 0
  private driftThreshold = 0.05

  getMode() {
    return this.state
  }

  evaluate(metrics: {
    drift: number
    failedExecutions: number
    chainDesync: boolean
  }) {
    if (metrics.chainDesync) {
      this.state = 'LOCKDOWN'
      return
    }

    this.failureCount = metrics.failedExecutions

    if (this.failureCount > 10) {
      this.state = 'READ_ONLY'
    }

    if (metrics.drift > this.driftThreshold) {
      this.state = 'ESCROW_ONLY'
    }

    if (metrics.drift < 0.01 && this.failureCount === 0) {
      this.state = 'NORMAL'
    }
  }
}

export const circuitBreakerEngine = new AXPTCircuitBreakerEngine()