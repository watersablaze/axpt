// src/engines/predictor/ExecutionCollapsePredictor.ts

import { temporalStateEngine } from "@/engines/temporal/TemporalStateEngine"
import { operatorTraceLedger } from "@/engines/operator/OperatorTraceLedger"

export type CollapsePrediction = {
  entityId: string

  collapseRisk: number
  confidence: number

  horizon: "IMMEDIATE" | "NEAR" | "DISTANT" | "STABLE"

  drivers: {
    driftAcceleration: number
    stabilityDecay: number
    divergenceVolatility: number
    immunityDepletion: number
    operatorDriftPressure: number
    operatorAlignmentPressure: number
  }

  timestamp: number
}

export class ExecutionCollapsePredictor {
  constructor(
    private temporal = temporalStateEngine,
    private operators = operatorTraceLedger
  ) {}

  predict(entityId: string): CollapsePrediction {

    const temporalState = this.temporal.build(entityId)
    const operatorField = this.computeOperatorField(entityId)

    const drivers = this.deriveDrivers(
      temporalState,
      operatorField
    )

    // ─────────────────────────────
    // COLLAPSE SCORE (SYSTEM + HUMAN COUPLED MODEL)
    // ─────────────────────────────

    const collapseRisk =
      (drivers.driftAcceleration * 0.28) +
      (drivers.stabilityDecay * 0.22) +
      (drivers.divergenceVolatility * 0.18) +
      (drivers.immunityDepletion * 0.12) +
      (drivers.operatorDriftPressure * 0.15) -
      (drivers.operatorAlignmentPressure * 0.1)

    // ─────────────────────────────
    // HORIZON CLASSIFICATION
    // ─────────────────────────────

    const horizon =
      collapseRisk > 0.8 ? "IMMEDIATE" :
      collapseRisk > 0.6 ? "NEAR" :
      collapseRisk > 0.35 ? "DISTANT" :
      "STABLE"

    return {
      entityId,
      collapseRisk,
      confidence: this.computeConfidence(drivers),
      horizon,
      drivers,
      timestamp: Date.now(),
    }
  }

  // ─────────────────────────────
  // OPERATOR FIELD EXTRACTION
  // ─────────────────────────────

  private computeOperatorField(entityId: string) {
    const traces = this.operators.getAll()

    const relevant = traces.filter(t => t.entityId === entityId)

    if (relevant.length === 0) {
      return {
        driftPressure: 0,
        alignmentPressure: 0,
      }
    }

    const driftPressure =
      relevant.reduce((sum, t) => sum + t.driftContribution, 0) /
      relevant.length

    const alignmentPressure =
      relevant.reduce((sum, t) => sum + t.stabilityDelta, 0) /
      relevant.length

    return {
      driftPressure: Math.max(0, driftPressure),
      alignmentPressure: Math.max(0, alignmentPressure),
    }
  }

  // ─────────────────────────────
  // DRIVER DERIVATION
  // ─────────────────────────────

  private deriveDrivers(
    state: any,
    operators: any
  ): CollapsePrediction["drivers"] {

    return {
      driftAcceleration: state.drift.acceleration,

      stabilityDecay:
        state.trend === "DEGRADING"
          ? Math.max(0, 1 - state.stability.latest)
          : 0,

      divergenceVolatility: state.stability.decay,

      immunityDepletion:
        1 - state.immunity.systemResilience,

      operatorDriftPressure: operators.driftPressure,

      operatorAlignmentPressure: operators.alignmentPressure,
    }
  }

  // ─────────────────────────────
  // CONFIDENCE MODEL
  // ─────────────────────────────

  private computeConfidence(drivers: CollapsePrediction["drivers"]) {
    const signalStrength =
      drivers.driftAcceleration +
      drivers.stabilityDecay +
      drivers.divergenceVolatility

    return Math.max(0.5, 1 - signalStrength * 0.2)
  }
}

/**
 * 🌐 SINGLETON
 */
export const executionCollapsePredictor =
  new ExecutionCollapsePredictor()