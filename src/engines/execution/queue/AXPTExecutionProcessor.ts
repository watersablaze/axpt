import { executionIntentQueue } from './AXPTExecutionIntentQueue'
import { treasuryGuardrails } from './AXPTTreasuryGuardrails'
import { lockEscrow, releaseEscrow } from '@/domains/escrow/services/escrowService'

export class AXPTExecutionProcessor {

  /**
   * 🔁 RUN PROCESSOR LOOP
   */
  async process() {
    const next = executionIntentQueue.getNext()

    if (!next) return

    const check = treasuryGuardrails.evaluate(next)

    if (!check.approved) {
      executionIntentQueue.updateStatus(next.id, 'BLOCKED')
      return
    }

    executionIntentQueue.updateStatus(next.id, 'EXECUTED')

    await this.execute(next)
  }

  /**
   * 🚀 EXECUTION ROUTER
   */
  private async execute(intent: any) {

    switch (intent.suggestedMode) {

      case 'ESCROW':
        return lockEscrow(intent.metadata?.caseId)

      case 'TRANSFER':
        return releaseEscrow(intent.metadata?.caseId)

      default:
        throw new Error('Unsupported execution mode')
    }
  }
}

export const executionProcessor = new AXPTExecutionProcessor()