import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"
import { executionDriftIndex } from "./ExecutionDriftIndex"

type StabilityPoint = {
  timestamp: number
  stabilityScore: number
  driftScore: number
  divergencePressure: number
  decisionVolatility: number
  finalityStrength: number
}

export class ExecutionStabilityGraphEngine {

  /**
   * 🧠 MAIN ENTRY POINT
   */
  build(escrowId: string, windowSize = 25): StabilityPoint[] {

    const memory = executionMemoryLedger.get(escrowId)
    const drift = executionDriftIndex.compute(escrowId)

    const window = memory.slice(-windowSize)

    const points: StabilityPoint[] = []

    for (let i = 1; i < window.length; i++) {

      const slice = window.slice(0, i)

      const stabilityScore = this.computeStability(slice, drift)

      const driftScore = drift[i]?.driftScore ?? 0

      const divergencePressure = this.computeDivergencePressure(slice)

      const decisionVolatility = this.computeVolatility(slice)

      const finalityStrength = this.computeFinality(slice)

      points.push({
        timestamp: window[i].timestamp,
        stabilityScore,
        driftScore,
        divergencePressure,
        decisionVolatility,
        finalityStrength,
      })
    }

    return points
  }

  // ─────────────────────────────
  // 🧠 CORE STABILITY FUNCTION
  // ─────────────────────────────

  private computeStability(history: any[], drift: any[]): number {

    const finalityStrength = this.computeFinality(history)
    const volatility = this.computeVolatility(history)
    const divergence = this.computeDivergencePressure(history)

    const latestDrift = drift?.[drift.length - 1]?.driftScore ?? 0

    // 🧠 stability equation
    return (
      finalityStrength * 0.4 +
      (1 - volatility) * 0.25 +
      (1 - divergence) * 0.25 +
      (1 - latestDrift) * 0.1
    )
  }

  // ─────────────────────────────
  // 🧠 FINALITY STRENGTH
  // ─────────────────────────────

  private computeFinality(history: any[]): number {
    const final = history.filter(h => h.type === "FINALITY")

    if (history.length === 0) return 0

    return final.length / history.length
  }

  // ─────────────────────────────
  // ⚡ DECISION VOLATILITY
  // ─────────────────────────────

  private computeVolatility(history: any[]): number {
    let flips = 0

    for (let i = 1; i < history.length; i++) {
      if (history[i].type !== history[i - 1].type) {
        flips++
      }
    }

    return history.length <= 1 ? 0 : flips / history.length
  }

  // ─────────────────────────────
  // ⚠️ DIVERGENCE PRESSURE
  // ─────────────────────────────

  private computeDivergencePressure(history: any[]): number {
    const divergenceEvents = history.filter(h =>
      h.type.includes("DIVERGENCE") ||
      h.type.includes("BLOCK")
    )

    return history.length === 0
      ? 0
      : divergenceEvents.length / history.length
  }
}

export const executionStabilityGraphEngine =
  new ExecutionStabilityGraphEngine()