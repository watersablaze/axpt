import type { AXPTEvent } from '@/engines/events/AXPTEventBus'

export type ReplayRequest = {
  entityId: string
  from?: number
  to?: number
}

export type ReplayFrame = {
  timestamp: number
  event: AXPTEvent
  state: any
}

export type ReplayResult = {
  entityId: string
  frames: ReplayFrame[]
  finalState: any
}

export class EventSourcedReplayEngine {
  constructor(
    private eventStore: {
      getEvents: (entityId: string) => Promise<AXPTEvent[]>
    }
  ) {}

  /**
   * 🧠 MAIN REPLAY ENTRYPOINT
   */
  async replay(req: ReplayRequest): Promise<ReplayResult> {
    const events = await this.eventStore.getEvents(req.entityId)

    const filtered = this.filter(events, req.from, req.to)
    const sorted = this.sort(filtered)

    const frames: ReplayFrame[] = []

    let state = this.createInitialState()

    /**
     * 🧬 EVENT FOLD (DETERMINISTIC STATE BUILD)
     */
    for (const event of sorted) {
      state = this.applyEvent(state, event)

      frames.push({
        timestamp: this.extractTimestamp(event),
        event,
        state: structuredClone(state),
      })
    }

    return {
      entityId: req.entityId,
      frames,
      finalState: state,
    }
  }

  /**
   * 🧠 PURE EVENT REDUCER (CORE OF SYSTEM TRUTH)
   */
  private applyEvent(state: any, event: AXPTEvent) {
    switch (event.type) {
      case 'TRANSFER_EXECUTED':
        return {
          ...state,
          transfers: [...(state.transfers ?? []), event.payload],
        }

      case 'ESCROW_UPDATED':
        return {
          ...state,
          escrows: [...(state.escrows ?? []), event.payload],
        }

      case 'DISPUTE_RAISED':
        return {
          ...state,
          disputes: [...(state.disputes ?? []), event.payload],
        }

      case 'SETTLEMENT_FINALIZED':
        return {
          ...state,
          settlements: [...(state.settlements ?? []), event.payload],
        }

      case 'RECONCILIATION_DRIFT_DETECTED':
        return {
          ...state,
          driftEvents: [...(state.driftEvents ?? []), event.payload],
        }

      default:
        return state
    }
  }

  /**
   * 🧠 INITIAL STATE (GENESIS BLOCK)
   */
  private createInitialState() {
    return {
      transfers: [],
      escrows: [],
      disputes: [],
      settlements: [],
      driftEvents: [],
    }
  }

  /**
   * 🧠 SORTING LAYER
   */
  private sort(events: AXPTEvent[]) {
    return [...events].sort(
      (a: any, b: any) => a.timestamp - b.timestamp
    )
  }

  /**
   * 🧠 FILTER WINDOW
   */
  private filter(events: AXPTEvent[], from?: number, to?: number) {
    return events.filter((e: any) => {
      if (from && e.timestamp < from) return false
      if (to && e.timestamp > to) return false
      return true
    })
  }

  /**
   * 🧠 TIMESTAMP RESOLUTION
   */
  private extractTimestamp(event: any) {
    return event.timestamp ?? Date.now()
  }
}