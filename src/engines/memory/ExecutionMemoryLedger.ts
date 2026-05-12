type MemoryRecordType =
  | "INTENT"
  | "REPLAY"
  | "DIVERGENCE"
  | "GOVERNANCE"
  | "FINALITY"
  | "BLOCK"

type MemoryRecord = {
  id: string
  escrowId: string
  type: MemoryRecordType
  timestamp: number
  data: any
  lineage: {
    eventId?: string
    snapshotId?: string
    txHash?: string
  }
}

export class ExecutionMemoryLedger {
  private memory = new Map<string, MemoryRecord[]>()

  append(record: MemoryRecord) {
    if (!this.memory.has(record.escrowId)) {
      this.memory.set(record.escrowId, [])
    }

    this.memory.get(record.escrowId)!.push(record)
  }

  get(escrowId: string) {
    return this.memory.get(escrowId) ?? []
  }

  /**
   * 🧠 PURE RECONSTRUCTION ONLY
   */
  reconstruct(escrowId: string) {
    const records = this.get(escrowId)

    return {
      escrowId,
      timeline: records,
      finalState: this.getFinalState(records),
    }
  }

  /**
   * 🧠 STRICT DERIVATION RULE
   * ONLY FINALITY RECORDS CAN SET FINAL STATE
   */
  private getFinalState(records: MemoryRecord[]) {
    let state = "UNKNOWN"

    for (const r of records) {
      if (r.type === "FINALITY") {
        state = r.data?.state ?? state
      }

      if (r.type === "BLOCK") {
        return "BLOCKED"
      }
    }

    return state
  }
}

export const executionMemoryLedger = new ExecutionMemoryLedger()