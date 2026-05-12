import type { GovernorResult } from '@/engines/governance/types'
import type { RiskSignal } from '@/engines/risk/PredictiveRiskEngine'
import type { TwinResult } from '@/engines/twin/AXPTDigitalTwinEngine'

export type CoherenceResult = {
  ok: boolean
  score: number
  flags: string[]
}

export class RuntimeCoherenceGuard {
  /**
   * 🧠 PRIMARY COHERENCE GATE
   */
  validateEnvelope(envelope: {
    req: any
    ctx: any | null
    twin: TwinResult | null
    risk: RiskSignal | null
    decision: GovernorResult | null
  }): CoherenceResult {
    const flags: string[] = []
    let score = 1

    /**
     * RISK LAYER
     */
    if (!envelope.risk) {
      flags.push('RISK_PENDING')
      score -= 0.1
    } else if (typeof envelope.risk.score !== 'number') {
      throw new Error('RISK_CORRUPTION')
    }

    if (envelope.risk && (envelope.risk.score < 0 || envelope.risk.score > 1)) {
      throw new Error('RISK_OUT_OF_BOUNDS')
    }

    if (envelope.risk && envelope.risk.score > 0.85) {
      flags.push('HIGH_RISK')
      score -= 0.3
    }

    /**
     * TWIN LAYER
     */
    if (!envelope.twin) {
      flags.push('TWIN_PENDING')
      score -= 0.1
    } else if (typeof envelope.twin.stressScore !== 'number') {
      throw new Error('TWIN_CORRUPTION')
    }

    if (envelope.twin && envelope.twin.stressScore > 0.85) {
      flags.push('HIGH_STRESS_TWIN')
      score -= 0.3
    }

    if (envelope.twin && !Array.isArray(envelope.twin.timelines)) {
      throw new Error('TWIN_TIMELINE_CORRUPTION')
    }

    /**
     * GOVERNANCE LAYER
     */
    const valid = ['TRANSFER', 'ESCROW', 'REJECT', 'QUARANTINE'] as const

    if (!envelope.decision) {
      flags.push('DECISION_PENDING')
      score -= 0.1
    } else if (!valid.includes(envelope.decision.decision as any)) {
      throw new Error('GOVERNANCE_CORRUPTION')
    }

    /**
     * CROSS-LAYER COHERENCE CHECKS
     */
    if (
      envelope.decision?.decision === 'TRANSFER' &&
      envelope.risk &&
      envelope.risk.score > 0.9
    ) {
      flags.push('ILLOGICAL_TRANSFER')
      score -= 0.4
    }

    if (
      envelope.decision?.decision === 'REJECT' &&
      envelope.twin &&
      envelope.twin.stressScore < 0.1
    ) {
      flags.push('FALSE_REJECTION')
      score -= 0.2
    }

    if (
      envelope.decision &&
      (envelope.decision.riskScore > 1 || envelope.decision.riskScore < 0)
    ) {
      throw new Error('DECISION_RISK_CORRUPTION')
    }

    /**
     * FINAL COHERENCE SCORE
     */
    const finalScore = Math.max(0, Math.min(1, score))

    return {
      ok: finalScore > 0.7,
      score: finalScore,
      flags,
    }
  }
}
