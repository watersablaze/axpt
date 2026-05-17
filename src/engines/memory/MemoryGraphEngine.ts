import { prisma } from '@/infrastructure/db/prisma'
import type { CFState } from '../core/state/CFState'
import type { MemoryNode } from './MemoryGraphTypes'

export class MemoryGraphEngine {

    private get memoryNode() {
    return (prisma as any).memoryNode
  }

  private emptyState(): CFState {
    return {
      transfers: [],
      escrows: [],
      disputes: [],
      settlements: [],
      transactions: [],
      liquidityIndex: 1,
      systemStress: 0,
      timestamp: Date.now(),
    }
  }

  /**
   * INGEST EVENT INTO MEMORY GRAPH
   */
  async ingest(node: MemoryNode) {
    const memoryNode = this.memoryNode

    if (!memoryNode?.create) {
      console.warn('[MemoryGraphEngine] memoryNode model unavailable; ingest skipped')
      return null
    }

    return memoryNode.create({
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
    const memoryNode = this.memoryNode

    if (!memoryNode?.findMany) {
      console.warn('[MemoryGraphEngine] memoryNode model unavailable; trace returned empty')
      return []
    }

    return memoryNode.findMany({
      where: { entityId },
      orderBy: { timestamp: 'asc' },
    })
  }

  /**
   * CAUSAL CHAIN
   */
  async causal(nodeId: string) {
    const memoryNode = this.memoryNode

    if (!memoryNode?.findUnique || !memoryNode?.findMany) {
      console.warn('[MemoryGraphEngine] memoryNode model unavailable; causal returned null')
      return null
    }

    const root = await memoryNode.findUnique({
      where: { id: nodeId },
    })

    if (!root) return null

    const parents = await memoryNode.findMany({
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
    const memoryNode = this.memoryNode

    if (!memoryNode?.findMany) {
      console.warn('[MemoryGraphEngine] memoryNode model unavailable; replay returned empty state')
      return this.emptyState()
    }

    const events = await memoryNode.findMany({
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
    const memoryNode = this.memoryNode

    if (!memoryNode?.findMany) {
      console.warn('[MemoryGraphEngine] memoryNode model unavailable; export returned empty state')
      return this.emptyState()
    }

    const events = await memoryNode.findMany({
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
    }, this.emptyState())
  }
}

export const executionRealityFabric = new MemoryGraphEngine()