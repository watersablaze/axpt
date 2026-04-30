import type { GovernorResult } from '@/engines/governance/types'
import type { RiskSignal } from '@/engines/risk/PredictiveRiskEngine'
import type { TwinResult } from '@/engines/twin/AXPTDigitalTwinEngine'

export class RuntimeCoherenceGuard {
  /**
   * 🧠 VALIDATE FULL EXECUTION ENVELOPE
   */
  validateEnvelope(envelope: {
    req: any
    ctx: any
    twin: TwinResult
    risk: RiskSignal
    decision: GovernorResult
  }) {
    this.validateRisk(envelope.risk)
    this.validateTwin(envelope.twin)
    this.validateDecision(envelope.decision)

    return true
  }

  /**
   * ⚠ RISK VALIDATION
   */
  private validateRisk(risk: RiskSignal) {
    if (typeof risk.score !== 'number') {
      throw new Error('RISK_CORRUPTION: invalid score')
    }

    if (!Array.isArray(risk.reasons)) {
      throw new Error('RISK_CORRUPTION: invalid reasons')
    }
  }

  /**
   * 🔮 TWIN VALIDATION
   */
  private validateTwin(twin: TwinResult) {
    if (typeof twin.riskScore !== 'number') {
      throw new Error('TWIN_CORRUPTION: missing riskScore')
    }

    if (typeof twin.stressScore !== 'number') {
      throw new Error('TWIN_CORRUPTION: missing stressScore')
    }

    if (!Array.isArray(twin.timelines)) {
      throw new Error('TWIN_CORRUPTION: invalid timelines')
    }
  }

  /**
   * ⚖ GOVERNANCE VALIDATION
   */
  private validateDecision(decision: GovernorResult) {
    const valid = ['TRANSFER', 'ESCROW', 'REJECT', 'QUARANTINE']

    if (!valid.includes(decision.decision)) {
      throw new Error('GOVERNANCE_CORRUPTION: invalid decision')
    }

    if (typeof decision.riskScore !== 'number') {
      throw new Error('GOVERNANCE_CORRUPTION: missing riskScore')
    }

    if (typeof decision.twinScore !== 'number') {
      throw new Error('GOVERNANCE_CORRUPTION: missing twinScore')
    }
  }
}