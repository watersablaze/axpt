import { executionOutcomeAnalyzer } from "@/engines/analysis/ExecutionOutcomeAnalyzer"
import { executionAdaptiveInfluenceEngine } from "@/engines/adaptation/ExecutionAdaptiveInfluenceEngine"
import { operatorTraceLedger } from "@/engines/operator/OperatorTraceLedger"

export class ExecutionInfluenceFeedbackLayer {

  /**
   * 🧠 MAIN ENTRY
   */
  async processOutcome(params: {
    operatorId: string
    entityId: string
    decision: any
    actualOutcome: any
  }) {

    const analysis =
      executionOutcomeAnalyzer.analyze({
        entityId: params.entityId,
        decision: params.decision,
        actualOutcome: params.actualOutcome,
      })

    const traces =
      operatorTraceLedger.getAll(params.operatorId)

    const adaptive =
      executionAdaptiveInfluenceEngine.computeInfluence(params.operatorId)

    // ─────────────────────────────
    // 1. LEARNING DELTA
    // ─────────────────────────────

    const learningDelta =
      analysis.learningSignal * (analysis.correctnessScore)

    // ─────────────────────────────
    // 2. ADAPTIVE CORRECTION SIGNAL
    // ─────────────────────────────

    const correctedInfluence =
      this.applyCorrection(adaptive, analysis)

    // ─────────────────────────────
    // 3. UPDATE ENGINE STATE
    // ─────────────────────────────

    executionAdaptiveInfluenceEngine["profiles"].set(
      params.operatorId,
      correctedInfluence
    )

    return {
      operatorId: params.operatorId,
      entityId: params.entityId,
      learningDelta,
      correctedInfluence,
      analysis,
    }
  }

  // ─────────────────────────────
  // 🧠 CORE CORRECTION FUNCTION
  // ─────────────────────────────

  private applyCorrection(
    current: any,
    analysis: any
  ) {

    const errorFactor =
      1 - analysis.correctnessScore

    return {
      ...current,

      // penalize unstable influence
      influenceWeight:
        this.clamp(
          current.influenceWeight -
          errorFactor * 0.2,
          0.05,
          1
        ),

      driftSensitivityModifier:
        this.clamp(
          current.driftSensitivityModifier +
          analysis.systemErrorVector.riskMisread * 0.1,
          0.1,
          1
        ),

      stabilityContributionScore:
        this.clamp(
          current.stabilityContributionScore +
          analysis.correctnessScore * 0.05,
          0,
          1
        ),

      lastUpdated: Date.now(),
    }
  }

  private clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }
}

export const executionInfluenceFeedbackLayer =
  new ExecutionInfluenceFeedbackLayer()