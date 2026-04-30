import { prisma } from '@/infrastructure/db/prisma'
import type { CFState } from '../core/state/CFState'

export class LedgerReplayEngine {
  /**
   * 🧠 FULL LEDGER RECONSTRUCTION
   */
  async replay(entityId: string): Promise<CFState> {
    const events = await prisma.memoryNode.findMany({
      where: { entityId },
      orderBy: { timestamp: 'asc' },
    })

    return this.fold(events)
  }

  /**
   * 🔁 DETERMINISTIC STATE REBUILD
   */
  private fold(events: any[]): CFState {
    return events.reduce<CFState>(
      (state, event) => {
        switch (event.type) {
          case 'TRANSFER':
            state.transfers.push(event)
            state.transactions.push(event)
            break

          case 'ESCROW':
            state.escrows.push(event)
            break

          case 'SETTLEMENT':
            state.settlements.push(event)
            break

          case 'DISPUTE':
            state.disputes.push(event)
            break
        }

        return state
      },
      {
        transfers: [],
        transactions: [],
        escrows: [],
        disputes: [],
        settlements: [],
        liquidityIndex: 1,
        systemStress: 0,
        timestamp: Date.now(),
      }
    )
  }
}
