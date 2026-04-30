import { prisma } from '@/infrastructure/db/prisma'
import type { CFState } from '../core/state/CFState'

export type AXPTCanonicalEvent = {
  id: string
  type: string
  entityId: string
  timestamp: number
  payload: any
}

export class AXPTEventSourcingKernel {
  /**
   * 🧾 WRITE EVENT (IMMUTABLE)
   */
  async append(event: AXPTCanonicalEvent) {
    return prisma.memoryNode.create({
      data: {
        id: event.id,
        type: event.type,
        entityId: event.entityId,
        timestamp: event.timestamp,
        metadata: event.payload,
      },
    })
  }

  /**
   * 🔁 STREAM ENTITY EVENTS
   */
  async stream(entityId: string) {
    return prisma.memoryNode.findMany({
      where: { entityId },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * 🧠 REBUILD SYSTEM STATE (CANONICAL TRUTH)
   */
  async rebuild(entityId: string): Promise<CFState> {
    const events = await this.stream(entityId)

    return events.reduce((state: CFState, e: any) => {
      switch (e.type) {
        case 'TRANSFER':
          state.transfers.push(e)
          state.transactions.push(e)
          break

        case 'ESCROW':
          state.escrows.push(e)
          break

        case 'SETTLEMENT':
          state.settlements.push(e)
          break

        case 'DISPUTE':
          state.disputes.push(e)
          break
      }

      return state
    }, {
      transfers: [],
      transactions: [],
      escrows: [],
      disputes: [],
      settlements: [],
      liquidityIndex: 1,
      systemStress: 0,
      timestamp: Date.now(),
    } as CFState)
  }
}
