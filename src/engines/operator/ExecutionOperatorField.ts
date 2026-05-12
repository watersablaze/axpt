import { operatorTraceLedger } from "@/engines/operator/OperatorTraceLedger"
import { executionAdaptiveInfluenceEngine } from "@/engines/adaptation/ExecutionAdaptiveInfluenceEngine"

export type OperatorFieldVector = {
  operatorId: string
  stabilityGravity: number
  driftForce: number
  riskAmplification: number
  influenceMass: number
  fieldContributionScore: number
  timestamp: number
}

export class ExecutionOperatorField {

  private fieldCache = new Map<string, OperatorFieldVector>()

  /**
   * 🧠 FIELD COMPUTATION
   */
  compute(operatorId: string): OperatorFieldVector {

    const profile =
      executionAdaptiveInfluenceEngine.computeInfluence(operatorId)

    const traces =
      operatorTraceLedger.getAll(operatorId)

    const stabilityGravity =
      profile.stabilityContributionScore * profile.influenceWeight

    const driftForce =
      this.computeDriftForce(traces, profile)

    const riskAmplification =
      this.computeRiskForce(traces)

    const influenceMass =
      profile.influenceWeight * traces.length

    const fieldContributionScore =
      stabilityGravity -
      driftForce -
      riskAmplification

    const vector: OperatorFieldVector = {
      operatorId,
      stabilityGravity,
      driftForce,
      riskAmplification,
      influenceMass,
      fieldContributionScore,
      timestamp: Date.now(),
    }

    this.fieldCache.set(operatorId, vector)

    return vector
  }

  /**
   * 🧠 SYSTEM-LEVEL QUERY
   */
  computeSystemField() {
    const all = [...this.fieldCache.values()]

    return {
      totalOperators: all.length,

      systemStabilityField:
        this.avg(all.map(v => v.stabilityGravity)),

      systemDriftField:
        this.avg(all.map(v => v.driftForce)),

      systemRiskField:
        this.avg(all.map(v => v.riskAmplification)),

      netSystemCoherence:
        this.avg(all.map(v => v.fieldContributionScore)),
    }
  }

  // ─────────────────────────────
  // 🧠 INTERNAL SIGNAL PROCESSORS
  // ─────────────────────────────

  private computeDriftForce(traces: any[], profile: any) {
    const drift =
      traces.reduce(
        (sum, t) => sum + (t.driftContribution ?? 0),
        0
      ) / Math.max(1, traces.length)

    return drift * (1 + profile.driftSensitivityModifier)
  }

  private computeRiskForce(traces: any[]) {
    return (
      traces.filter(t => t.divergenceImpact > 0.6).length /
      Math.max(1, traces.length)
    )
  }

  private avg(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)
  }
}

export const executionOperatorField =
  new ExecutionOperatorField()
