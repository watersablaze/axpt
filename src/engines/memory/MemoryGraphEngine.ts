import { prisma } from '@/infrastructure/db/prisma'
import type { CFState } from '../core/state/CFState'
import type { MemoryNode } from './MemoryGraphTypes'

export class MemoryGraphEngine {

  /**
   * INGEST EVENT INTO MEMORY GRAPH
   */
  async ingest(node: MemoryNode) {
    return prisma.memoryNode.create({
      data: {
        id: node.id,
        type: node.type,
        entityId: node.entityId,
        timestamp: node.timestamp,

        stateBefore: node.stateBefore as any,
        stateAfter: node.stateAfter as any,

        delta: node.delta as any,
        metadata: node.metadata ?? {},

        causalParents: node.causalParents ?? [],
      },
    })
  }

  /**
   * ENTITY HISTORY
   */
  async trace(entityId: string) {
    return prisma.memoryNode.findMany({
      where: { entityId },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * CAUSAL CHAIN
   */
  async causal(nodeId: string) {
    const root = await prisma.memoryNode.findUnique({
      where: { id: nodeId },
    })

    if (!root) return null

    const parents = await prisma.memoryNode.findMany({
      where: {
        id: {
          in: (root.causalParents as string[]) ?? [],
        },
      },
    })

    return { root, parents }
  }

  /**
   * TEMPORAL REPLAY
   */
  async replay(entityId: string, at: number): Promise<CFState> {
    const events = await prisma.memoryNode.findMany({
      where: {
        entityId,
        timestamp: { lte: at },
      },
      orderBy: { timestamp: 'asc' },
    })

    return this.reduce(events)
  }

  /**
   * FULL EXPORT
   */
  async exportFinancialState(): Promise<CFState> {
    const events = await prisma.memoryNode.findMany({
      orderBy: { timestamp: 'asc' },
      take: 5000,
    })

    return this.reduce(events)
  }

  /**
   * STATE REDUCER
   */
  private reduce(events: MemoryNode[]): CFState {
    return events.reduce<CFState>((state, event) => {
      switch (event.type) {
        case 'TRANSFER':
          return {
            ...state,
            transfers: [...state.transfers, event],
            transactions: [...state.transactions, event],
          }

        case 'ESCROW':
          return {
            ...state,
            escrows: [...state.escrows, event],
          }

        case 'SETTLEMENT':
          return {
            ...state,
            settlements: [...state.settlements, event],
          }

        case 'DISPUTE':
          return {
            ...state,
            disputes: [...state.disputes, event],
          }

        default:
          return state
      }
    }, {
      transfers: [],
      escrows: [],
      disputes: [],
      settlements: [],
      transactions: [],
      liquidityIndex: 1,
      systemStress: 0,
      timestamp: Date.now(),
    })
  }
}

export const executionRealityFabric = new MemoryGraphEngine()