import { governorEngine } from "@/engines/governance/AXPTGovernorEngine"
import { circuitBreakerEngine } from "@/engines/governance/AXPTCircuitBreakerEngine"
import { unifiedOrganismFieldEngine } from "@/engines/runtime/clientSingletons"

/**
 * 🧠 SELF-ADAPTIVE TREASURY INTELLIGENCE ENGINE
 * Continuously tunes system behavior based on observed outcomes
 */
export class AXPTAdaptiveTreasuryEngine {

  private history: any[] = []

  /**
   * 🔁 MAIN ADAPTATION LOOP
   */
  async runCycle(metrics: {
    executionSuccessRate: number
    executionFailureRate: number
    avgReconciliationDrift: number
    chainLatency: number
    queueDepth: number
  }) {

    const organism = unifiedOrganismFieldEngine.getState()

    // store history for trend analysis
    this.history.push({ ...metrics, timestamp: Date.now() })

    // keep bounded memory
    if (this.history.length > 1000) {
      this.history.shift()
    }

    // ──────────────────────────────
    // 1. HIGH FAILURE ADAPTATION
    // ──────────────────────────────
    if (metrics.executionFailureRate > 0.3) {
      governorEngine.updateState({
        riskCeiling: 0.6,
        maxTransferBaseUnits: BigInt(5000),
        escrowOnly: true,
      })
    }

    // ──────────────────────────────
    // 2. HIGH DRIFT RESPONSE
    // ──────────────────────────────
    if (metrics.avgReconciliationDrift > 0.2) {
      circuitBreakerEngine.forceMode("ESCROW_ONLY")
    }

    // ──────────────────────────────
    // 3. SYSTEM STABILITY OPTIMIZATION
    // ──────────────────────────────
    if (
      metrics.executionSuccessRate > 0.85 &&
      organism.stability > 0.7
    ) {
      governorEngine.updateState({
        riskCeiling: 0.9,
        escrowOnly: false,
      })
    }

    // ──────────────────────────────
    // 4. QUEUE PRESSURE CONTROL
    // ──────────────────────────────
    if (metrics.queueDepth > 500) {
      circuitBreakerEngine.forceMode("DEGRADED")
    }

    // ──────────────────────────────
    // 5. CHAIN LATENCY SAFETY
    // ──────────────────────────────
    if (metrics.chainLatency > 20) {
      circuitBreakerEngine.forceMode("READ_ONLY")
    }

    return this.getAdaptationSnapshot()
  }

  /**
   * 🧠 TREND ANALYSIS OUTPUT
   */
  private getAdaptationSnapshot() {
    const last = this.history.slice(-10)

    return {
      trend: {
        avgFailure:
          last.reduce((a, b) => a + b.executionFailureRate, 0) /
          Math.max(1, last.length),

        avgDrift:
          last.reduce((a, b) => a + b.avgReconciliationDrift, 0) /
          Math.max(1, last.length),
      },

      systemState: {
        governor: governorEngine.getState(),
        circuit: circuitBreakerEngine.getMode(),
      },
    }
  }
}

/**
 * 🧬 SINGLETON
 */
export const adaptiveTreasuryEngine =
  new AXPTAdaptiveTreasuryEngine()
