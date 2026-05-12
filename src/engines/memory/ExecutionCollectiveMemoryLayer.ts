import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"

type CollectiveMemoryState = {
  globalRiskBias: number
  globalDriftBias: number
  globalFinalityBias: number
  globalGovernanceStrictness: number
}

export class ExecutionCollectiveMemoryLayer {

  private state: CollectiveMemoryState = {
    globalRiskBias: 0.5,
    globalDriftBias: 0.5,
    globalFinalityBias: 0.5,
    globalGovernanceStrictness: 0.5,
  }

  /**
   * 🧠 UPDATE FROM FULL SYSTEM HISTORY
   */
  update() {

    const allEntities = executionMemoryLedger["memory"] // internal map access

    const events = Array.from(allEntities.values()).flat()

    const successes = events.filter(e => e.type === "FINALITY")
    const failures = events.filter(e => e.type === "BLOCK" || e.type === "DIVERGENCE")

    const avgRisk = this.avg(events, "risk")
    const avgDrift = this.avg(events, "drift")
    const avgFinality = this.avg(events, "finality")

    const successRate =
      successes.length / Math.max(1, events.length)

    const failureRate =
      failures.length / Math.max(1, events.length)

    // ─────────────────────────────
    // 🧠 GLOBAL PRIORS SHIFT
    // ─────────────────────────────

    this.state.globalRiskBias =
      this.clamp(avgRisk + failureRate * 0.2)

    this.state.globalDriftBias =
      this.clamp(avgDrift + failureRate * 0.3)

    this.state.globalFinalityBias =
      this.clamp(avgFinality + successRate * 0.2)

    this.state.globalGovernanceStrictness =
      this.clamp(failureRate * 0.5 + avgRisk * 0.5)

    return this.state
  }

  /**
   * 🧠 PROVIDE PRIORS TO ETK
   */
  getPriors() {
    return this.state
  }

  /**
   * 🧠 INTERNAL HELPERS
   */
  private avg(events: any[], key: string) {
    if (!events.length) return 0
    return events.reduce((a, b) => a + (b.data?.[key] ?? 0), 0) / events.length
  }

  private clamp(v: number) {
    return Math.max(0, Math.min(1, v))
  }
}

export const executionCollectiveMemory =
  new ExecutionCollectiveMemoryLayer()