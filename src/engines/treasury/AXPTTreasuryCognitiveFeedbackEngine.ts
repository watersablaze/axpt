import { reconciliationSyncEngine } from "@/engines/reconciliation/AXPTReconcilationSyncEngine"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"
import { organismClock } from "@/engines/runtime/serverSingletons"

/**
 * 🧠 TREASURY COGNITIVE FEEDBACK ENGINE
 * Adaptive system learning layer
 */
export class AXPTTreasuryCognitiveFeedbackEngine {

  private driftHistory: number[] = []
  private riskBias = 1.0

  /**
   * 🔁 MAIN LEARNING LOOP (CALLED BY CLOCK)
   */
  async tick(caseId: string) {

    /**
     * 1. GET RECONCILIATION TRUTH
     */
    const report = await reconciliationSyncEngine.sync(caseId)
    if (!report) return

    const drift = report.drift

    this.recordDrift(drift)

    /**
     * 2. ADAPT SYSTEM BEHAVIOR
     */
    this.adaptExecutionSensitivity()
    this.adaptQueueBehavior(drift)

    return {
      drift,
      riskBias: this.riskBias,
    }
  }

  /**
   * 📊 RECORD DRIFT HISTORY
   */
  private recordDrift(drift: number) {
    this.driftHistory.push(drift)

    if (this.driftHistory.length > 50) {
      this.driftHistory.shift()
    }
  }

  /**
   * 🧠 ADAPT EXECUTION SENSITIVITY
   */
  private adaptExecutionSensitivity() {
    const avgDrift = this.average(this.driftHistory)

    /**
     * SYSTEM TOO UNSTABLE → tighten execution
     */
    if (avgDrift > 0.2) {
      this.riskBias = Math.min(2.0, this.riskBias + 0.1)
    }

    /**
     * SYSTEM STABLE → relax constraints
     */
    if (avgDrift < 0.05) {
      this.riskBias = Math.max(0.5, this.riskBias - 0.05)
    }
  }

  /**
   * 📦 ADAPT QUEUE BEHAVIOR
   */
  private adaptQueueBehavior(drift: number) {

    const next = executionIntentQueue.getNext()
    if (!next) return

    /**
     * HIGH DRIFT → BLOCK EXECUTION
     */
    if (drift > 0.3) {
      executionIntentQueue.updateStatus(next.id, "BLOCKED")
    }

    /**
     * LOW DRIFT → APPROVE FLOW
     */
    if (drift < 0.1) {
      executionIntentQueue.updateStatus(next.id, "APPROVED")
    }
  }

  /**
   * 📈 UTIL
   */
  private average(arr: number[]) {
    if (!arr.length) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }
}

/**
 * 🧬 SINGLETON
 */
export const treasuryCognitiveEngine =
  new AXPTTreasuryCognitiveFeedbackEngine()
