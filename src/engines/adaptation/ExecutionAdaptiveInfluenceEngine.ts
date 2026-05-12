import { operatorTraceLedger } from "@/engines/operator/OperatorTraceLedger"
import { executionOutcomeAnalyzer } from "@/engines/analysis/ExecutionOutcomeAnalyzer"

export type AdaptiveInfluenceProfile = {
  operatorId: string
  influenceWeight: number
  driftSensitivityModifier: number
  stabilityContributionScore: number
  riskBiasModifier: number
  learningRate: number
  lastUpdated: number
}

export class ExecutionAdaptiveInfluenceEngine {

  private profiles = new Map<string, AdaptiveInfluenceProfile>()

  /**
   * 🧠 MAIN ENTRY
   */
  computeInfluence(operatorId: string) {

    const traces =
      operatorTraceLedger.getAll(operatorId)

    const profile =
      this.getOrCreateProfile(operatorId)

    const outcomeSignals =
      this.extractOutcomeSignals(traces)

    const stabilityScore =
      this.computeStabilityScore(traces)

    const driftScore =
      this.computeDriftScore(traces)

    const reliability =
      this.computeReliability(traces)

    // ─────────────────────────────
    // 1. INFLUENCE WEIGHT (CORE SYSTEM BIAS)
    // ─────────────────────────────

    const influenceWeight =
      this.clamp(
        0.5 +
        (reliability * 0.3) +
        (stabilityScore * 0.3) -
        (driftScore * 0.4),
        0.05,
        1
      )

    // ─────────────────────────────
    // 2. DRIFT SENSITIVITY MODIFIER
    // ─────────────────────────────

    const driftSensitivityModifier =
      this.clamp(
        1 - driftScore * 0.7,
        0.2,
        1
      )

    // ─────────────────────────────
    // 3. STABILITY CONTRIBUTION SCORE
    // ─────────────────────────────

    const stabilityContributionScore =
      (stabilityScore * 0.6) +
      (reliability * 0.4)

    // ─────────────────────────────
    // 4. RISK BIAS MODIFIER
    // ─────────────────────────────

    const riskBiasModifier =
      this.clamp(
        1 - outcomeSignals.riskErrorRate,
        0.3,
        1
      )

    // ─────────────────────────────
    // 5. LEARNING RATE (ADAPTATION SPEED)
    // ─────────────────────────────

    const learningRate =
      Math.max(0.05, 1 - stabilityScore)

    const updated: AdaptiveInfluenceProfile = {
      operatorId,

      influenceWeight,
      driftSensitivityModifier,
      stabilityContributionScore,
      riskBiasModifier,
      learningRate,

      lastUpdated: Date.now(),
    }

    this.profiles.set(operatorId, updated)

    return updated
  }

  // ─────────────────────────────
  // 🧠 DERIVED SIGNALS
  // ─────────────────────────────

  private computeStabilityScore(traces: any[]) {
    if (!traces.length) return 0.5

    const deltas =
      traces.map(t => t.stabilityDelta ?? 0)

    const avg =
      deltas.reduce((a, b) => a + b, 0) / deltas.length

    return this.clamp((avg + 1) / 2, 0, 1)
  }

  private computeDriftScore(traces: any[]) {
    if (!traces.length) return 0

    const drift =
      traces.map(t => t.driftContribution ?? 0)

    return this.clamp(
      drift.reduce((a, b) => a + b, 0) / drift.length,
      0,
      1
    )
  }

  private computeReliability(traces: any[]) {
    if (!traces.length) return 0.5

    const commits =
      traces.filter(t => t.decisionOutcome === "COMMIT").length

    return commits / traces.length
  }

  private extractOutcomeSignals(traces: any[]) {
    return {
      riskErrorRate:
        traces.filter(t => t.divergenceImpact > 0.5).length /
        Math.max(1, traces.length),
    }
  }

  // ─────────────────────────────
  // 🧠 UTIL
  // ─────────────────────────────

  private getOrCreateProfile(operatorId: string): AdaptiveInfluenceProfile {
    return (
      this.profiles.get(operatorId) ?? {
        operatorId,
        influenceWeight: 0.5,
        driftSensitivityModifier: 0.5,
        stabilityContributionScore: 0.5,
        riskBiasModifier: 0.5,
        learningRate: 0.1,
        lastUpdated: Date.now(),
      }
    )
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
  }
}

export const executionAdaptiveInfluenceEngine =
  new ExecutionAdaptiveInfluenceEngine()
