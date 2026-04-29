import { prisma } from '@/infrastructure/db/prisma'
import { EscrowEngine } from '../escrow/EscrowEngine'
import { SettlementEngine } from '../settlement/SettlementEngine'

export type DisputeStatus =
  | 'RAISED'
  | 'UNDER_REVIEW'
  | 'ARBITRATION'
  | 'DECIDED'
  | 'ENFORCED'
  | 'CLOSED'

export class DisputeEngine {
  constructor(
    private escrow = new EscrowEngine(),
    private settlement = new SettlementEngine()
  ) {}

  /**
   * RAISE DISPUTE → FREEZE ESCROW
   */
  async raise(params: {
    escrowId: string
    reason: string
    raisedBy: string
  }) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: params.escrowId },
    })

    if (!escrow) throw new Error('ESCROW_NOT_FOUND')

    /**
     * LOCK ESCROW STATE
     */
    await this.escrow.transition({
      escrowId: escrow.id,
      next: 'DISPUTED',
      actor: params.raisedBy,
      metadata: {
        reason: params.reason,
      },
    })

    /**
     * CREATE DISPUTE RECORD
     */
    const dispute = await prisma.caseEvent.create({
      data: {
        caseId: escrow.caseId,
        type: 'DISPUTE_RAISED' as any,
        payload: {
          escrowId: escrow.id,
          reason: params.reason,
          raisedBy: params.raisedBy,
        },
      },
    })

    return dispute
  }

  /**
   * RESOLVE DISPUTE → ENFORCE FINALITY
   */
  async resolve(params: {
    escrowId: string
    decision: 'RELEASE' | 'REFUND' | 'SPLIT' | 'VOID'
    actor: string
  }) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: params.escrowId },
    })

    if (!escrow) throw new Error('ESCROW_NOT_FOUND')

    /**
     * MOVE TO ARBITRATION STATE (NOT FINAL)
     */
    await this.escrow.transition({
      escrowId: escrow.id,
      next: 'DISPUTED',
      actor: params.actor,
      metadata: {
        decision: params.decision, // ✅ goes here instead
      },
    })

    /**
     * APPLY SETTLEMENT RULES
     */
    const result = await this.settlement.finalize({
      escrowId: escrow.id,
      decision: params.decision,
      actor: params.actor,
      reason: params.reason,
    })

    return {
      escrowId: escrow.id,
      decision: params.decision,
      status: 'ENFORCED',
      result,
    }
  }
}