import type { ExecutionIntent } from '@/engines/core/types/ExecutionIntent'

export class AXPTTreasuryGuardrails {

  /**
   * 🧠 VALIDATION GATE
   */
  evaluate(intent: ExecutionIntent): {
    approved: boolean
    reason?: string
  } {

    if (intent.amountBaseUnits <= 0n) {
      return { approved: false, reason: 'INVALID_AMOUNT' }
    }

    if (intent.suggestedMode === 'REJECT') {
      return { approved: false, reason: 'RISK_ENGINE_REJECTED' }
    }

    if (intent.riskHint && intent.riskHint > 0.9) {
      return { approved: false, reason: 'RISK_TOO_HIGH' }
    }

    if (intent.suggestedMode === 'QUARANTINE') {
      return { approved: false, reason: 'QUARANTINED_BY_SYSTEM' }
    }

    return { approved: true }
  }
}

export const treasuryGuardrails = new AXPTTreasuryGuardrails()