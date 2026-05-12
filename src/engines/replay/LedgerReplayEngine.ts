export type LedgerEventType =
  | 'TRANSFER'
  | 'ESCROW'
  | 'SETTLEMENT'
  | 'DISPUTE'
  | 'UNKNOWN'

export type LedgerReplayEvent = {
  id: string
  type: LedgerEventType | string
  timestamp: number
  entityId?: string | null
  payload?: unknown
}

export type LedgerReplayState = {
  events: LedgerReplayEvent[]
  transfers: LedgerReplayEvent[]
  escrows: LedgerReplayEvent[]
  disputes: LedgerReplayEvent[]
  settlements: LedgerReplayEvent[]

  liquidityIndex: number
  systemStress: number

  timestamp: number
  degraded: boolean
  source: 'empty' | 'injected'
}

export class LedgerReplayEngine {
  /**
   * Minimal deterministic replay.
   *
   * For now, this does NOT read Prisma directly.
   * Bind database/event-source access outside this pure replay engine.
   */
  async replay(
    entityId?: string,
    injectedEvents: LedgerReplayEvent[] = [],
  ): Promise<LedgerReplayState> {
    const events = this.normalizeEvents(injectedEvents, entityId)

    return this.fold(events, injectedEvents.length === 0)
  }

  private normalizeEvents(
    events: LedgerReplayEvent[],
    entityId?: string,
  ): LedgerReplayEvent[] {
    return events
      .filter((event) => {
        if (!entityId) return true
        return event.entityId === entityId
      })
      .map((event, index) => ({
        ...event,
        id: event.id ?? `event-${index}`,
        type: event.type ?? 'UNKNOWN',
        timestamp: Number(event.timestamp ?? 0),
      }))
      .sort((a, b) => {
        if (a.timestamp !== b.timestamp) {
          return a.timestamp - b.timestamp
        }

        return String(a.id).localeCompare(String(b.id))
      })
  }

  private fold(
    events: LedgerReplayEvent[],
    degraded: boolean,
  ): LedgerReplayState {
    const initial: LedgerReplayState = {
      events: [],
      transfers: [],
      escrows: [],
      disputes: [],
      settlements: [],

      liquidityIndex: 0,
      systemStress: 0,

      timestamp: 0,
      degraded,
      source: degraded ? 'empty' : 'injected',
    }

    const state = events.reduce<LedgerReplayState>((acc, event) => {
      const next: LedgerReplayState = {
        ...acc,
        events: [...acc.events, event],
      }

      switch (event.type) {
        case 'TRANSFER':
          next.transfers = [...acc.transfers, event]
          break

        case 'ESCROW':
          next.escrows = [...acc.escrows, event]
          break

        case 'SETTLEMENT':
          next.settlements = [...acc.settlements, event]
          break

        case 'DISPUTE':
          next.disputes = [...acc.disputes, event]
          break
      }

      return next
    }, initial)

    return {
      ...state,
      liquidityIndex: this.computeLiquidity(state),
      systemStress: this.computeStress(state),
      timestamp: state.events.at(-1)?.timestamp ?? 0,
    }
  }

  private computeLiquidity(state: LedgerReplayState): number {
    const inflow = state.transfers.length + state.escrows.length
    const outflow = state.disputes.length + state.settlements.length

    if (inflow === 0 && outflow === 0) return 0

    const ratio = inflow / Math.max(1, outflow)

    return clamp01(1 / (1 + Math.abs(1 - ratio)))
  }

  private computeStress(state: LedgerReplayState): number {
    const anomalyPressure =
      state.disputes.length * 0.4 + state.escrows.length * 0.2

    const volatility =
      state.transfers.length === 0
        ? 0
        : state.disputes.length / state.transfers.length

    return clamp01(anomalyPressure * 0.5 + volatility * 0.5)
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export const ledgerReplayEngine = new LedgerReplayEngine()