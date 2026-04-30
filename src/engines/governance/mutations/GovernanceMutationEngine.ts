import type { GovernanceProfile } from '../GovernanceEvolutionEngine'

export type MutationInput = {
  driftScore: number
  anomalyFrequency: number
  instabilityScore: number
  history: any[]
}

export type MutationResult = {
  updatedProfile: GovernanceProfile
  mutations: string[]
  mutationStrength: number
}

export class GovernanceMutationEngine {
  /**
   * 🧬 MAIN MUTATION LOOP
   */
  mutate(
    profile: GovernanceProfile,
    input: MutationInput
  ): MutationResult {
    const mutations: string[] = []

    const { driftScore, anomalyFrequency, instabilityScore } = input

    /**
     * 🧠 MUTATION STRENGTH (CONTROL KNOB)
     */
    const mutationStrength = this.computeMutationStrength(
      driftScore,
      anomalyFrequency,
      instabilityScore
    )

    /**
     * 🧬 RULE 1 — HIGH DRIFT = TIGHTER RISK THRESHOLDS
     */
    if (driftScore > 0.2) {
      profile.riskHigh = this.clamp(
        profile.riskHigh - mutationStrength * 0.05
      )

      profile.riskMid = this.clamp(
        profile.riskMid - mutationStrength * 0.03
      )

      mutations.push('TIGHTEN_RISK_THRESHOLDS')
    }

    /**
     * 🧬 RULE 2 — HIGH ANOMALY FREQUENCY = INCREASE TWIN SENSITIVITY
     */
    if (anomalyFrequency > 5) {
      profile.twinThreshold = this.clamp(
        profile.twinThreshold - mutationStrength * 0.04
      )

      mutations.push('INCREASE_TWIN_SENSITIVITY')
    }

    /**
     * 🧬 RULE 3 — HIGH INSTABILITY = INCREASE DRIFT TOLERANCE (COUNTERINTUITIVE SAFETY)
     */
    if (instabilityScore > 0.7) {
      profile.driftTolerance = this.clamp(
        profile.driftTolerance + mutationStrength * 0.02
      )

      mutations.push('EXPAND_DRIFT_TOLERANCE')
    }

    return {
      updatedProfile: profile,
      mutations,
      mutationStrength,
    }
  }

  /**
   * 🧠 MUTATION INTENSITY MODEL
   */
  private computeMutationStrength(
    drift: number,
    anomalies: number,
    instability: number
  ) {
    return Math.min(
      1,
      drift * 0.5 + anomalies * 0.3 + instability * 0.2
    )
  }

  /**
   * 🧮 SAFETY CLAMP
   */
  private clamp(value: number) {
    return Math.max(0.1, Math.min(0.95, value))
  }
}