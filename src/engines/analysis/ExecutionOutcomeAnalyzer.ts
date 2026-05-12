import type { ExecutionDecision } from "@/engines/contracts/ExecutionContracts"
import type { CollapsePrediction } from "@/engines/predictor/ExecutionCollapsePredictor"
import { executionCollapsePredictor } from "@/engines/predictor/ExecutionCollapsePredictor"
import { temporalStateEngine } from "@/engines/temporal/TemporalStateEngine"

export type OutcomeType =
  | "CORRECT"
  | "MISCLASSIFICATION"
  | "OVERRESPONSE"
  | "UNDERRESPONSE"

export class ExecutionOutcomeAnalyzer {

  analyze(params: {
    entityId: string
    decision: ExecutionDecision
    actualOutcome: {
      finalState: string
      chainState?: string
      systemEvent?: string
    }
  }) {

    const { entityId, decision, actualOutcome } = params

    const collapsePrediction =
      executionCollapsePredictor.predict(entityId)

    const temporal = temporalStateEngine.build(entityId)

    // ─────────────────────────────
    // 1. BASE ERROR COMPUTATION
    // ─────────────────────────────

    const collapseError =
      Math.abs(
        collapsePrediction.collapseRisk -
        this.inferActualRisk(actualOutcome)
      )

    const stabilityError =
      Math.abs(
        temporal.stability.latest -
        this.inferActualStability(actualOutcome)
      )

    // ─────────────────────────────
    // 2. OUTCOME CLASSIFICATION
    // ─────────────────────────────

    const correctnessScore =
      1 - (collapseError * 0.5 + stabilityError * 0.5)

    let outcomeType: OutcomeType = "CORRECT"

    if (correctnessScore < 0.4) outcomeType = "MISCLASSIFICATION"
    else if (collapseError > 0.6) outcomeType = "OVERRESPONSE"
    else if (stabilityError > 0.6) outcomeType = "UNDERRESPONSE"

    // ─────────────────────────────
    // 3. LEARNING SIGNAL
    // ─────────────────────────────

    const learningSignal =
      (1 - correctnessScore) *
      (decision.status === "BLOCK" ? 1.2 : 1)

    return {
      entityId,
      outcomeType,
      correctnessScore,
      divergenceFromPrediction: collapseError,
      systemErrorVector: {
        riskMisread: collapseError,
        stabilityMisread: stabilityError,
        collapseUnderestimation:
          Math.max(0, collapsePrediction.collapseRisk - collapseError),
      },
      learningSignal,
      timestamp: Date.now(),
    }
  }

  private inferActualRisk(actual: any): number {
    if (actual.finalState === "SETTLED") return 0.1
    if (actual.finalState === "RELEASED") return 0.3
    if (actual.finalState === "DISPUTED") return 0.8
    return 0.5
  }

  private inferActualStability(actual: any): number {
    if (actual.systemEvent === "CLEAN_FINALITY") return 1
    if (actual.systemEvent === "MINOR_DRIFT") return 0.7
    if (actual.systemEvent === "MAJOR_DRIFT") return 0.3
    return 0.5
  }
}

export const executionOutcomeAnalyzer =
  new ExecutionOutcomeAnalyzer()
