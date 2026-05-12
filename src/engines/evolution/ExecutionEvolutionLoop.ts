import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"

type ETKWeightState = {
  riskWeight: number
  driftWeight: number
  governanceWeight: number
  finalityWeight: number
}

export class ExecutionEvolutionLoop {

  private weights: ETKWeightState = {
    riskWeight: 0.3,
    driftWeight: 0.1,
    governanceWeight: 0.2,
    finalityWeight: 0.4,
  }

  /**
   * 🧠 MAIN EVOLUTION STEP
   */
  evolve(entityId: string) {

    const memory = executionMemoryLedger.get(entityId)

    const decisions = memory.filter(
      m => m.type === "FINALITY" || m.type === "GOVERNANCE"
    )

    const failures = memory.filter(
      m => m.type === "BLOCK" || m.type === "DIVERGENCE"
    )

    const driftFailures = memory.filter(
      m => m.type === "DIVERGENCE"
    )

    const successRate =
      decisions.length > 0
        ? 1 - failures.length / decisions.length
        : 1

    const driftRate =
      driftFailures.length / Math.max(1, memory.length)

    // ─────────────────────────────
    // 🧠 ADAPT WEIGHTS (CORE LOOP)
    // ─────────────────────────────

    // If system is failing → increase safety sensitivity
    if (successRate < 0.6) {
      this.weights.riskWeight += 0.05
      this.weights.driftWeight += 0.05
      this.weights.finalityWeight += 0.03
    }

    // If system is stable → relax constraints slightly
    if (successRate > 0.85) {
      this.weights.riskWeight -= 0.02
      this.weights.governanceWeight -= 0.01
    }

    // If drift is high → tighten structural control
    if (driftRate > 0.3) {
      this.weights.driftWeight += 0.1
      this.weights.finalityWeight += 0.05
    }

    // Clamp values (stability constraint)
    this.normalize()

    return {
      entityId,
      weights: this.weights,
      successRate,
      driftRate,
    }
  }

  /**
   * 🧠 NORMALIZATION GUARD
   */
  private normalize() {
    const sum =
      this.weights.riskWeight +
      this.weights.driftWeight +
      this.weights.governanceWeight +
      this.weights.finalityWeight

    this.weights.riskWeight /= sum
    this.weights.driftWeight /= sum
    this.weights.governanceWeight /= sum
    this.weights.finalityWeight /= sum
  }

  /**
   * 🧠 EXPOSE CURRENT STATE
   */
  getWeights() {
    return this.weights
  }
}

export const executionEvolutionLoop =
  new ExecutionEvolutionLoop()