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
        if (
          !intent.metadata?.caseId ||
          !intent.metadata?.fromWalletId ||
          !intent.metadata?.toWalletId
        ) {
          throw new Error('ESCROW_CREATION_REQUIRES_FULL_PAYLOAD')
        }

        return lockEscrow({
          caseId: intent.metadata.caseId,
          amountBaseUnits: intent.amountBaseUnits,
          assetCode: intent.assetCode,
          fromWalletId: intent.metadata.fromWalletId,
          toWalletId: intent.metadata.toWalletId,
        })

      case 'TRANSFER':
        if (!intent.metadata?.escrowId) {
          throw new Error('ESCROW_RELEASE_REQUIRES_ESCROW_ID')
        }

        return releaseEscrow(intent.metadata.escrowId)

      default:
        throw new Error('Unsupported execution mode')
    }
  }
}

export const executionProcessor = new AXPTExecutionProcessor()
