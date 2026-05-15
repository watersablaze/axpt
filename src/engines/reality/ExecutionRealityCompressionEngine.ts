import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"
import { executionRealityFabric } from "@/engines/reality/ExecutionRealityFabric"
import type {
  RealityDelta,
  RealityState,
} from "./types/RealityCoreTypes"

import type { AuthoritySpineContract } from "@/engines/contracts/AuthoritySpineContract"

export class ExecutionRealityCompressionEngine {

  private archetypes = new Map<string, any>()
  private deltas = new Map<string, RealityDelta>()

  compress(entityId: string): AuthoritySpineContract {

    const memory = executionMemoryLedger.get(entityId)
    const reality = executionRealityFabric.query(entityId)

    const risk = this.avg(memory, "risk")
    const drift = this.avg(memory, "drift")
    const stability = this.computeStability(reality)

    const state = this.classify(risk, drift, stability)

    const previous = this.archetypes.get(entityId)

    const delta: RealityDelta = {
      entityId,
      deltaRisk: risk - (previous?.riskProfile ?? 0),
      deltaDrift: drift - (previous?.driftProfile ?? 0),
      deltaStability: stability - (previous?.stabilityProfile ?? 1),
      intensity: this.computeAnomaly(memory),
    }

    this.deltas.set(entityId, delta)

    const spine: AuthoritySpineContract = {
      entityId,

      reality: {
        state,
        risk,
        drift,
        stability,
        confidence: this.computeConfidence(memory),
      },

      intent: {
        type: "UNKNOWN",
        severity: risk,
        confidence: 1,
      },

      governance: {
        decision: "ESCROW",
        riskScore: risk,
        finalityScore: stability,
      },

      trace: {
        traceId: crypto.randomUUID(),
        timestamp: Date.now(),
        source: "REALITY",
      },
    }

    return spine
  }

  private classify(
    risk: number,
    drift: number,
    stability: number
  ): RealityState {

    if (risk > 0.8 && drift > 0.7) return "QUARANTINED"
    if (stability > 0.8 && risk < 0.3) return "STABLE"
    if (drift > 0.6) return "DRIFTING"
    if (risk > 0.6 || drift > 0.6) return "VOLATILE"

    return "UNKNOWN"
  }

  private computeStability(realitySlice: any[]) {
    if (!realitySlice?.length) return 1
    return realitySlice.reduce((a, b) => a + (b.coherence ?? 1), 0) / realitySlice.length
  }

  private computeAnomaly(memory: any[]) {
    const blocks = memory.filter(m => m.type === "BLOCK")
    return blocks.length / Math.max(1, memory.length)
  }

  private avg(memory: any[], key: string) {
    if (!memory.length) return 0
    return memory.reduce((a, b) => a + (b.data?.[key] ?? 0), 0) / memory.length
  }

  private computeConfidence(memory: any[]) {
    if (!memory.length) return 0.5
    return Math.min(1, memory.length / 50)
  }

  getArchetype(entityId: string) {
    return this.archetypes.get(entityId)
  }

  getDelta(entityId: string) {
    return this.deltas.get(entityId)
  }
}

export const executionRealityCompressionEngine =
  new ExecutionRealityCompressionEngine()