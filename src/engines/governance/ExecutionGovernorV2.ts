import type { ExecutionContract } from '../core/types/ExecutionContract'
import type { RiskSignal } from '../risk/PredictiveRiskEngine'
import type { TwinResult } from '../twin/AXPTDigitalTwinEngine'
import type { GovernorResult } from './types'

export type GovernorInput = ExecutionContract & {
  twin: TwinResult
  risk: RiskSignal
}

export class ExecutionGovernorV2 {
  async evaluate(input: GovernorInput): Promise<GovernorResult> {
    const { risk, twin: twinResult } = input

    if (risk.score > 0.85 || twinResult.stressScore > 0.85) {
      return {
        decision: 'QUARANTINE',
        reason: 'HIGH_RISK_PROFILE',
        riskScore: risk.score,
        twinScore: twinResult.riskScore,
      }
    }

    if (
      risk.score > 0.6 ||
      twinResult.riskScore > 0.6 ||
      twinResult.stressScore > 0.6
    ) {
      return {
        decision: 'ESCROW',
        reason: 'RISK_ESCALATION',
        riskScore: risk.score,
        twinScore: twinResult.riskScore,
      }
    }

    if (twinResult.recommendation === 'REJECT') {
      return {
        decision: 'REJECT',
        reason: 'TWIN_REJECTION',
        riskScore: risk.score,
        twinScore: twinResult.riskScore,
      }
    }

    return {
      decision: 'TRANSFER',
      riskScore: risk.score,
      twinScore: twinResult.riskScore,
    }
  }
}

export { ExecutionGovernorV2 as ExecutionGovernor }
