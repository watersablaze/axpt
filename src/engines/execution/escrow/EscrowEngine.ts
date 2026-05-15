import { prisma } from '@/infrastructure/db/prisma'
import { EscrowStateMachine } from './escrowStateMachine'
import { emitEscrowEvent } from './escrowEvents'
import type { EscrowStatus } from '@/domains/escrow/escrowStatus'

export class EscrowEngine {
  private stateMachine = new EscrowStateMachine()

  /**
   * CREATE ESCROW ENTRY
   */
  async initiate(input: {
    caseId: string
    fromUserId: string
    toUserId: string
    fromWalletId?: string
    toWalletId?: string
    assetCode: string
    amountBaseUnits: bigint
  }) {
    const [fromWallet, toWallet] = await Promise.all([
      input.fromWalletId
        ? Promise.resolve({ id: input.fromWalletId })
        : prisma.wallet.findUnique({
            where: { userId: input.fromUserId },
            select: { id: true },
          }),
      input.toWalletId
        ? Promise.resolve({ id: input.toWalletId })
        : prisma.wallet.findUnique({
            where: { userId: input.toUserId },
            select: { id: true },
          }),
    ])

    if (!fromWallet || !toWallet) {
      throw new Error('ESCROW_WALLET_NOT_FOUND')
    }

    const caseId = input.caseId
    const amountBaseUnits = input.amountBaseUnits.toString()
    const assetCode = input.assetCode
    const fromWalletId = fromWallet.id
    const toWalletId = toWallet.id

    const escrow = await prisma.escrow.create({
      data: {
        escrowId: crypto.randomUUID(),
        caseId,
        amountBaseUnits,
        assetCode,
        fromWalletId,
        toWalletId,
        status: 'INITIATED',
        chainState: 'PENDING',
        reconciliationState: 'UNRECONCILED',
      },
    })

    emitEscrowEvent({
      escrowId: escrow.escrowId,
      from: null,
      to: 'INITIATED',
      metadata: input,
    })

    return escrow
  }

  /**
   * STATE TRANSITION ENTRYPOINT
   */
  async transition(params: {
    escrowId: string
    next: EscrowStatus
    actor?: string
    metadata?: any
  }) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: params.escrowId },
    })

    if (!escrow) throw new Error('ESCROW_NOT_FOUND')

    const allowed = this.stateMachine.canTransition(
      escrow.status as EscrowStatus,
      params.next
    )

    if (!allowed) {
      throw new Error(
        `INVALID_ESCROW_TRANSITION: ${escrow.status} → ${params.next}`
      )
    }

    const updated = await prisma.escrow.update({
      where: { id: params.escrowId },
      data: {
        status: params.next,
      },
    })

    emitEscrowEvent({
      escrowId: params.escrowId,
      from: escrow.status as EscrowStatus,
      to: params.next,
      actor: params.actor,
      metadata: params.metadata,
    })

    return updated
  }

  /**
   * FINAL LOCK (called by TransferEngine)
   */
  async lockFunds(escrowId: string) {
    return this.transition({
      escrowId,
      next: 'FUNDS_LOCKED',
    })
  }
}
