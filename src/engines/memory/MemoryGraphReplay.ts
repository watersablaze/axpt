import type { MemoryNode } from './MemoryGraphTypes'

export class MemoryGraphReplay {
  reconstruct(events: MemoryNode[]) {
    return events.reduce((state: any, event) => {
      switch (event.type) {
        case 'TRANSFER':
          state.balanceFlow = (state.balanceFlow ?? 0n) + (event.delta?.amount ?? 0n)
          break

        case 'ESCROW':
          state.locked = true
          break

        case 'SETTLEMENT':
          state.finalized = true
          break
      }

      return state
    }, {})
  }
}