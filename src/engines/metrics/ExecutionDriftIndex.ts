import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"

type DriftPoint = {
  timestamp: number
  driftScore: number
  volatility: number
  divergenceRate: number
  decisionEntropy: number
}

export class ExecutionDriftIndex {

  /**
   * 🧠 COMPUTE SYSTEM DRIFT OVER TIME WINDOW
   */
  compute(escrowId: string, windowSize = 20): DriftPoint[] {

    const memory = executionMemoryLedger.get(escrowId)

    const window = memory.slice(-windowSize)

    const points: DriftPoint[] = []

    for (let i = 1; i < window.length; i++) {

      const prev = window[i - 1]
      const curr = window[i]

      const driftScore = this.computeDrift(prev, curr, window.slice(0, i))

      const volatility = this.computeVolatility(window.slice(0, i))

      const divergenceRate = this.computeDivergenceRate(window.slice(0, i))

      const decisionEntropy = this.computeEntropy(window.slice(0, i))

      points.push({
        timestamp: curr.timestamp,
        driftScore,
        volatility,
        divergenceRate,
        decisionEntropy,
      })
    }

    return points
  }

  /**
   * 🧠 CORE DRIFT FUNCTION
   */
  private computeDrift(prev: any, curr: any, history: any[]) {

    const typeShift = prev.type !== curr.type ? 0.4 : 0
    const stateShift = this.stateDistance(prev.data, curr.data)
    const temporalGap = curr.timestamp - prev.timestamp

    const normalizedGap = Math.min(1, temporalGap / 60000)

    return typeShift + stateShift + normalizedGap * 0.2
  }

  /**
   * 🧠 STATE DISTANCE (STRUCTURAL CHANGE)
   */
  private stateDistance(a: any, b: any) {
    if (!a || !b) return 0.3

    const keys = new Set([...Object.keys(a), ...Object.keys(b)])

    let diff = 0
    let count = 0

    for (const k of keys) {
      if (a?.[k] !== b?.[k]) diff += 1
      count += 1
    }

    return count === 0 ? 0 : diff / count
  }

  /**
   * 📊 VOLATILITY = DECISION INSTABILITY
   */
  private computeVolatility(history: any[]) {
    let changes = 0

    for (let i = 1; i < history.length; i++) {
      if (history[i].type !== history[i - 1].type) {
        changes++
      }
    }

    return history.length <= 1 ? 0 : changes / history.length
  }

  /**
   * ⚠️ DIVERGENCE RATE
   */
  private computeDivergenceRate(history: any[]) {
    const divergences = history.filter(
      h => h.type === "DIVERGENCE" || h.type === "EXECUTION_BLOCKED_DIVERGENCE"
    )

    return history.length === 0
      ? 0
      : divergences.length / history.length
  }

  /**
   * 🧠 ENTROPY (DECISION UNCERTAINTY)
   */
  private computeEntropy(history: any[]) {
    const counts: Record<string, number> = {}

    for (const h of history) {
      counts[h.type] = (counts[h.type] || 0) + 1
    }

    const total = history.length
    let entropy = 0

    for (const key in counts) {
      const p = counts[key] / total
      entropy -= p * Math.log2(p)
    }

    return entropy
  }
}

export const executionDriftIndex = new ExecutionDriftIndex()