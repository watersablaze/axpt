// src/engines/signals/state/ExecutionSignalStateBuffer.ts

type BufferedSignalEvent = {
  id: string
  entityId: string
  type: string
  timestamp: number

  payload?: any

  // minimal structural tagging only
  kind: "ESCROW" | "CHAIN" | "SYSTEM" | "UNKNOWN"
}

export class ExecutionSignalStateBuffer {
  /**
   * 🧠 Entity-scoped temporal storage
   */
  private buffer = new Map<string, BufferedSignalEvent[]>()

  /**
   * 📥 Append event (ONLY mutation allowed)
   */
  append(event: BufferedSignalEvent) {
    if (!event.entityId) return

    const existing = this.buffer.get(event.entityId)

    if (!existing) {
      this.buffer.set(event.entityId, [event])
      return
    }

    existing.push(event)
  }

  /**
   * 📚 Retrieve ordered event stream
   */
  get(entityId: string): BufferedSignalEvent[] {
    return this.buffer.get(entityId) ?? []
  }

  /**
   * 🔁 Replay-safe snapshot (immutable copy)
   */
  snapshot(entityId: string): BufferedSignalEvent[] {
    return [...this.get(entityId)]
  }

  /**
   * 🧹 Optional pruning (future safety layer)
   */
  prune(entityId: string, maxSize = 500) {
    const events = this.buffer.get(entityId)
    if (!events) return

    if (events.length > maxSize) {
      this.buffer.set(entityId, events.slice(-maxSize))
    }
  }

  /**
   * 🧭 Debug / observability only
   */
  size(entityId: string): number {
    return this.buffer.get(entityId)?.length ?? 0
  }
}

/**
 * 🌐 SINGLETON (Phase 1 standard pattern)
 */
export const executionSignalStateBuffer =
  new ExecutionSignalStateBuffer()