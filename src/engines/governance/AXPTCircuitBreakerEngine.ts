import { unifiedOrganismFieldEngine } from "@/engines/runtime/clientSingletons"

type SystemMode =
  | "NORMAL"
  | "DEGRADED"
  | "ESCROW_ONLY"
  | "READ_ONLY"
  | "GLOBAL_PAUSE"

export class AXPTCircuitBreakerEngine {

  private mode: SystemMode = "NORMAL"

  /**
   * 🧠 REAL-TIME SYSTEM HEALTH EVALUATION
   */
  evaluate(system: {
    queueDepth: number
    drift: number
    chainLag: number
    failureRate: number
  }) {

    const organism = unifiedOrganismFieldEngine.getState()

    // ──────────────────────────────
    // CRITICAL FAILURE CONDITIONS
    // ──────────────────────────────
    if (system.failureRate > 0.5) {
      this.mode = "GLOBAL_PAUSE"
    }

    if (system.drift > 0.8) {
      this.mode = "ESCROW_ONLY"
    }

    if (system.queueDepth > 1000) {
      this.mode = "DEGRADED"
    }

    if (system.chainLag > 50) {
      this.mode = "READ_ONLY"
    }

    if (organism.decisionPressure > 0.95) {
      this.mode = "ESCROW_ONLY"
    }

    return this.mode
  }

  /**
   * 🔒 EXTERNAL CONTROL
   */
  forceMode(mode: SystemMode) {
    this.mode = mode
  }

  getMode() {
    return this.mode
  }
}

/**
 * 🧬 SINGLETON
 */
export const circuitBreakerEngine = new AXPTCircuitBreakerEngine()
