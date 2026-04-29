import { prisma } from '@/infrastructure/db/prisma'
import { EscrowEngine } from '../escrow/EscrowEngine'
import { LedgerWriter } from '../transfer/LedgerWriter'

export class SettlementEngine {
  constructor(
    private escrow = new EscrowEngine(),
    private ledger = new LedgerWriter()
  ) {}

  /**
   * FINALITY PIPELINE
   */
  async finalize(params: {
    escrowId: string
    actor?: string
  }) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: params.escrowId },
    })

    if (!escrow) throw new Error('ESCROW_NOT_FOUND')

    /**
     * 1. VALIDATION GATE
     */
    if (escrow.status !== 'SETTLEMENT_READY') {
      throw new Error('ESCROW_NOT_READY_FOR_FINALITY')
    }

    /**
     * 2. FINALIZATION LOCK
     */
    await this.escrow.transition({
      escrowId: escrow.id,
      next: 'RELEASED',
      actor: params.actor,
    })

    /**
     * 3. LEDGER FINALIZATION MARKER
     */
    await prisma.eventLog.create({
      data: {
        caseId: escrow.caseId,
        actor: params.actor ?? 'SETTLEMENT_ENGINE',
        action: 'SETTLEMENT_FINALIZED',
        detail: {
          escrowId: escrow.id,
          final: true,
        },
      },
    })

    return {
      escrowId: escrow.id,
      status: 'SETTLED',
      immutable: true,
    }
  }
}