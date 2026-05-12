import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"
import { executionRealityFabric } from "@/engines/reality/ExecutionRealityFabric"

export class ExecutionRealityCompressionEngine {

  private archetypes = new Map<string, RealityArchetype>()
  private deltas = new Map<string, RealityDelta>()

  /**
   * 🧠 MAIN COMPRESSION FUNCTION
   */
  compress(entityId: string) {

    const memory = executionMemoryLedger.get(entityId)
    const reality = executionRealityFabric.query(entityId)

    const risk = this.avg(memory, "risk")
    const drift = this.avg(memory, "drift")
    const stability = this.computeStability(reality)
    const governance = this.avg(memory, "governance")

    const previous = this.archetypes.get(entityId)

    const archetype: RealityArchetype = {
      entityId,
      dominantBehavior: this.classify(risk, drift, stability),

      riskProfile: risk,
      driftProfile: drift,
      stabilityProfile: stability,
      governanceProfile: governance,

      confidence: this.computeConfidence(memory),
    }

    const delta: RealityDelta = {
      entityId,

      driftChange: risk - (previous?.riskProfile ?? 0),
      riskChange: drift - (previous?.driftProfile ?? 0),
      stabilityChange: stability - (previous?.stabilityProfile ?? 1),

      anomalySpike: this.computeAnomaly(memory),
    }

    this.archetypes.set(entityId, archetype)
    this.deltas.set(entityId, delta)

    return {
      archetype,
      delta,
    }
  }

  /**
   * 🧠 BEHAVIOR CLASSIFICATION
   */
  private classify(risk: number, drift: number, stability: number) {

    if (risk > 0.8 && drift > 0.7) {
      return "UNSTABLE_AGGRESSIVE"
    }

    if (stability > 0.8 && risk < 0.3) {
      return "STABLE_COMPLIANT"
    }

    if (drift > 0.6) {
      return "OSCILLATING_BEHAVIOR"
    }

    return "NEUTRAL_SYSTEM"
  }

  /**
   * 🧠 STABILITY DERIVED FROM REALITY FIELD
   */
  private computeStability(realitySlice: any[]) {

    if (!realitySlice.length) return 1

    const coherence = realitySlice.reduce(
      (a, b) => a + (b.coherence ?? 1),
      0
    ) / realitySlice.length

    return coherence
  }

  /**
   * 🧠 ANOMALY DETECTION (COMPRESSION LOSS SIGNAL)
   */
  private computeAnomaly(memory: any[]) {

    const blocks = memory.filter(m => m.type === "BLOCK")
    const total = memory.length

    return blocks.length / Math.max(1, total)
  }

  /**
   * 🧠 AVERAGING UTILITY
   */
  private avg(memory: any[], key: string) {
    if (!memory.length) return 0
    return memory.reduce((a, b) => a + (b.data?.[key] ?? 0), 0) / memory.length
  }

  /**
   * 🧠 CONFIDENCE IN COMPRESSION
   */
  private computeConfidence(memory: any[]) {
    if (!memory.length) return 0.5
    return Math.min(1, memory.length / 50)
  }

  /**
   * 🧠 READ OUTPUTS
   */
  getArchetype(entityId: string) {
    return this.archetypes.get(entityId)
  }

  getDelta(entityId: string) {
    return this.deltas.get(entityId)
  }
}

export const executionRealityCompressionEngine =
  new ExecutionRealityCompressionEngine()