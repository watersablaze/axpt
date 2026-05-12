import { organismSnapshotStore } from "@/engines/runtime/serverSingletons"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"
import { unifiedOrganismFieldEngine } from "@/engines/runtime/AXPTUnifiedOrganismFieldEngine"

/**
 * 🧠 SELF-ADAPTIVE TREASURY INTELLIGENCE LAYER
 *
 * This is the "autonomic nervous system" of AXPT.
 */
export class AXPTTreasuryIntelligenceEngine {

  /**
   * 🔁 MAIN ADAPTATION LOOP
   */
  run() {
    const latest = organismSnapshotStore.getLatest()
    if (!latest) return

    const state = latest.state
    const drift = state.drift
    const risk = state.riskLevel
    const pressure = state.decisionPressure

    this.adaptExecutionThresholds(drift, risk, pressure)
    this.reprioritizeQueue(risk, pressure)
  }

  /**
   * ⚖️ ADAPT EXECUTION THRESHOLDS
   */
  private adaptExecutionThresholds(
    drift: number,
    risk: string,
    pressure: number
  ) {
    /**
     * HIGH DRIFT → tighten system
     */
    if (drift > 0.7 || risk === "CRITICAL") {
      process.env.AXPT_EXECUTION_GUARD = "STRICT"
    }

    /**
     * LOW DRIFT → relax system
     */
    if (drift < 0.3 && pressure < 0.5) {
      process.env.AXPT_EXECUTION_GUARD = "NORMAL"
    }
  }

  /**
   * 📊 QUEUE REPRIORITIZATION
   */
  private reprioritizeQueue(
    risk: string,
    pressure: number
  ) {
    const next = executionIntentQueue.getNext()
    if (!next) return

    /**
     * CRITICAL SYSTEM STATE → BLOCK EXECUTION
     */
    if (risk === "CRITICAL" && pressure > 0.8) {
      executionIntentQueue.updateStatus(next.id, "BLOCKED")
    }

    /**
     * STABLE SYSTEM → APPROVE FLOW
     */
    if (risk === "LOW" && pressure < 0.4) {
      executionIntentQueue.updateStatus(next.id, "APPROVED")
    }
  }
}

/**
 * 🧬 SINGLETON
 */
export const treasuryIntelligenceEngine =
  new AXPTTreasuryIntelligenceEngine()
