import { prisma } from '@/infrastructure/db/prisma'

export class LedgerReplayEngine {
  /**
   * RECONSTRUCT SYSTEM STATE FROM EVENTS
   */
  async replay(caseId: string) {
    const events = await prisma.caseEvent.findMany({
      where: { caseId },
      orderBy: { createdAt: 'asc' },
    })

    const state = {
      balances: new Map<string, bigint>(),
      escrow: null,
      disputes: [],
      settlements: [],
    }

    for (const event of events) {
      switch (event.type) {
        case 'TRANSFER_EXECUTED':
          this.applyTransfer(state, event.payload)
          break

        case 'ESCROW_UPDATED':
          this.applyEscrow(state, event.payload)
          break

        case 'DISPUTE_RAISED':
          state.disputes.push(event.payload)
          break

        case 'SETTLEMENT_FINALIZED':
          state.settlements.push(event.payload)
          break
      }
    }

    return state
  }

  private applyTransfer(state: any, payload: any) {
    const from = state.balances.get(payload.fromUserId) ?? 0n
    const to = state.balances.get(payload.toUserId) ?? 0n

    state.balances.set(payload.fromUserId, from - BigInt(payload.amount))
    state.balances.set(payload.toUserId, to + BigInt(payload.amount))
  }

  private applyEscrow(state: any, payload: any) {
    state.escrow = payload
  }
}