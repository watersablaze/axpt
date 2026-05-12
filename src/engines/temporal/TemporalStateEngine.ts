// src/engines/temporal/TemporalStateEngine.ts

import { executionDriftIndex } from "@/engines/metrics/ExecutionDriftIndex"
import { executionStabilityGraphEngine } from "@/engines/metrics/ExecutionStabilityGraphEngine"
import { executionEvolutionLoop } from "@/engines/evolution/ExecutionEvolutionLoop"
import { executionImmunityLayer } from "@/engines/adaptation/ExecutionImmunityLayer"

export type TemporalTrend = "STABLE" | "DEGRADING" | "IMPROVING"

export type TemporalStateSnapshot = {
  entityId: string

  trend: TemporalTrend   

  drift: {
    series: number[]
    latest: number
    acceleration: number
  }

  stability: {
    series: number[]
    latest: number
    decay: number
  }

  evolution: {
    weights: {
      finalityWeight: number
      driftWeight: number
      riskWeight: number
    }
  }

  immunity: {
    driftSensitivity: number
    systemResilience: number
  }

  timestamp: number
}

export class TemporalStateEngine {

  /**
   * 🧠 SINGLE TEMPORAL SURFACE
   */
  build(entityId: string): TemporalStateSnapshot {

    // ─────────────────────────────
    // 1. DRIFT LAYER
    // ─────────────────────────────

    const driftSeries =
      executionDriftIndex.compute(entityId) ?? []

    const driftValues = driftSeries.map(d => d.driftScore)

    const driftLatest =
      driftValues[driftValues.length - 1] ?? 0

    const driftPrev =
      driftValues[driftValues.length - 2] ?? driftLatest

    const driftAcceleration =
      Math.max(0, driftLatest - driftPrev)

    // ─────────────────────────────
    // 2. STABILITY LAYER
    // ─────────────────────────────

    const stabilitySeries =
      executionStabilityGraphEngine.build(entityId) ?? []

    const stabilityValues = stabilitySeries.map(s => s.stabilityScore)

    const stabilityLatest =
      stabilityValues[stabilityValues.length - 1] ?? 1

    const stabilityPrev =
      stabilityValues[stabilityValues.length - 2] ?? stabilityLatest

    const stabilityDecay =
      Math.max(0, stabilityPrev - stabilityLatest)

    // ─────────────────────────────
    // 3. TREND (FIXED CORE LOGIC)
    // ─────────────────────────────

    const trend: TemporalTrend =
      stabilityLatest < stabilityPrev
        ? "DEGRADING"
        : stabilityLatest > stabilityPrev
        ? "IMPROVING"
        : "STABLE"

    // ─────────────────────────────
    // 4. EVOLUTION LAYER
    // ─────────────────────────────

    const evolution =
      executionEvolutionLoop.evolve(entityId)

    // ─────────────────────────────
    // 5. IMMUNITY LAYER
    // ─────────────────────────────

    const immunity =
      executionImmunityLayer.adapt(entityId)

    // ─────────────────────────────
    // 6. COMPOSITION
    // ─────────────────────────────

    return {
      entityId,

      trend,

      drift: {
        series: driftValues,
        latest: driftLatest,
        acceleration: driftAcceleration,
      },

      stability: {
        series: stabilityValues,
        latest: stabilityLatest,
        decay: stabilityDecay,
      },

      evolution: {
        weights: evolution.weights,
      },

      immunity: {
        driftSensitivity: immunity.driftSensitivity,
        systemResilience: immunity.systemResilience,
      },

      timestamp: Date.now(),
    }
  }
}

/**
 * 🌐 SINGLETON
 */
export const temporalStateEngine =
  new TemporalStateEngine()