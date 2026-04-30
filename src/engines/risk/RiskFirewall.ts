import { PredictiveRiskEngine } from './PredictiveRiskEngine'
import type { CFState } from '../core/state/CFState'

export type FirewallDecision =
  | { action: 'ALLOW' }
  | { action: 'ESCROW_FORCE'; reason: string }
  | { action: 'BLOCK'; reason: string }

export class RiskFirewall {
  private riskEngine = new PredictiveRiskEngine()

  async evaluate(input: {
    userId: string
    context: CFState
  }): Promise<FirewallDecision> {
    const risk = await this.riskEngine.evaluate(input)

    /**
     * ──────────────────────────────
     * CRITICAL BLOCK
     * ──────────────────────────────
     */
    if (risk.level === 'CRITICAL') {
      return {
        action: 'BLOCK',
        reason: 'Critical systemic risk detected',
      }
    }

    /**
     * ──────────────────────────────
     * ESCROW FORCE
     * ──────────────────────────────
     */
    if (risk.level === 'HIGH') {
      return {
        action: 'ESCROW_FORCE',
        reason: risk.reasons.join(', '),
      }
    }

    /**
     * ──────────────────────────────
     * NORMAL FLOW
     * ──────────────────────────────
     */
    return { action: 'ALLOW' }
  }
}
