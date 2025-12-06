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
  | 'live:open-full'         // ⭐ NEW
  | 'nommo:ceremony:opened'  // ⭐ NEW
  | 'nommo:spike'            // ⭐ NEW
  | 'nommo:warning'          // ⭐ NEW
  | 'live:ws:connected'      // ⭐ NEW
  | 'live:ws:disconnected'   // ⭐ NEW
  | 'live:ws:open'           // ⭐ legacy bridge
  | 'live:ws:closed'         // ⭐ legacy bridge
  | 'live:command';          // ⭐ NEW

// Shared tab registry for nommo debug panel
export type NommoTabName =
  | 'live'
  | 'system'
  | 'aura'
  | 'bloom'
  | 'ceremony'
  | 'mode';

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
  | { name: 'live:error'; data: { message: string; at: number; error?: string | null } }
  | { name: 'ceremony:phase'; data: CeremonyPhasePayload }
  | { name: 'performance:mode'; data: { mode: 'low' | 'medium' | 'high' } }
  | { name: 'debug:log'; data: { channel: string; message: string; meta?: any } }
  | { name: 'nommo:switch-tab'; data: { tab: NommoTabName } }               // ⭐ NEW
  | { name: 'live:open-mini'; data: Record<string, never> }                // ⭐ NEW
  | { name: 'live:open-full'; data: Record<string, never> }                // ⭐ NEW
  | { name: 'nommo:ceremony:opened'; data: Record<string, never> }         // ⭐ NEW
  | { name: 'nommo:spike'; data: { peakViewers?: number } }                // ⭐ NEW
  | { name: 'nommo:warning'; data: { reason?: string } }                   // ⭐ NEW
  | { name: 'live:ws:connected'; data: { at: number } }                    // ⭐ NEW
  | { name: 'live:ws:disconnected'; data: { at: number; error?: boolean } }// ⭐ NEW
  | { name: 'live:ws:open'; data: { url?: string } }                       // ⭐ legacy bridge
  | { name: 'live:ws:closed'; data: { error?: boolean } }                  // ⭐ legacy bridge
  | { name: 'live:command'; data: { command: string; [key: string]: any } }; // ⭐ NEW

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
    this.listeners.get(name)!.add(listener as any);

    return () => {
      this.listeners.get(name)?.delete(listener as any);
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
        listener(payload as any);
      } catch (err) {
        console.error('[EventBus] listener error:', name, err);
      }
    }
  }

  off<T extends EventPayload['name']>(
    name: T,
    listener: Listener<Extract<EventPayload, { name: T }>>,
  ) {
    this.listeners.get(name)?.delete(listener as any);
  }

  clearAll() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
