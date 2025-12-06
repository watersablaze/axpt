// src/lib/oracle/EventBus.ts

/************************************************************
 * EVENT NAME REGISTRY
 ************************************************************/
type EventName =
  | 'live:status:update'
  | 'live:status:change'
  | 'live:error'
  | 'ceremony:phase'
  | 'performance:mode'
  | 'debug:log'
  | 'nommo:switch-tab'       // ⭐ NEW
  | 'live:open-mini'         // ⭐ NEW
  | 'live:open-full';        // ⭐ NEW

/************************************************************
 * PAYLOAD TYPES
 ************************************************************/
export interface LiveStatusEventPayload {
  online: boolean;
  viewers: number;
  peakViewers?: number;
  bitrateKbps?: number | null;
  ingestHealthy?: boolean;
  uptimeSeconds?: number | null;
  error?: string | null;
  source?: 'poll' | 'ws' | 'manual';
}

export interface CeremonyPhasePayload {
  phase: string;
  startedAt: number;
}

export type EventPayload =
  | { name: 'live:status:update'; data: LiveStatusEventPayload }
  | { name: 'live:status:change'; data: LiveStatusEventPayload }
  | { name: 'live:error'; data: { message: string; at: number } }
  | { name: 'ceremony:phase'; data: CeremonyPhasePayload }
  | { name: 'performance:mode'; data: { mode: 'low' | 'medium' | 'high' } }
  | { name: 'debug:log'; data: { channel: string; message: string; meta?: any } }
  | { name: 'nommo:switch-tab'; data: { tab: string } }            // ⭐ NEW
  | { name: 'live:open-mini'; data: void }                         // ⭐ NEW
  | { name: 'live:open-full'; data: void };                        // ⭐ NEW

type Listener<T extends EventPayload = EventPayload> = (event: T) => void;

/************************************************************
 * EVENT BUS IMPLEMENTATION
 ************************************************************/
class EventBus {
  private listeners = new Map<EventName, Set<Listener>>();

  on<T extends EventPayload['name']>(
    name: T,
    listener: Listener<Extract<EventPayload, { name: T }>>,
  ): () => void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    // @ts-expect-error internal dispatch mechanism
    this.listeners.get(name)!.add(listener);

    return () => {
      // @ts-expect-error internal dispatch mechanism
      this.listeners.get(name)?.delete(listener);
    };
  }

  emit<T extends EventPayload['name']>(
    name: T,
    data: Extract<EventPayload, { name: T }>['data'],
  ) {
    const set = this.listeners.get(name);
    if (!set || set.size === 0) return;

    const payload = { name, data } as EventPayload;

    for (const listener of set) {
      try {
        // @ts-expect-error runtime dispatch
        listener(payload);
      } catch (err) {
        console.error('[EventBus] listener error:', name, err);
      }
    }
  }

  clearAll() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();