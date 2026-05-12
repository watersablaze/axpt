export type TraceEventType =
  | "EVENT_RECEIVED"
  | "EVENT_REJECTED"
  | "EVENT_NORMALIZED"
  | "RECONCILED"
  | "ESCROW_INTENT"
  | "ESCROW_CONFIRMED"
  | "GOVERNANCE_ALLOWED"
  | "GOVERNANCE_BLOCKED"
  | "SNAPSHOT_EMITTED"
  | "WS_BROADCAST"
  | "STREAM_BLOCKED"
  | "CONTRACT_VIOLATION"
  | "ONCHAIN_ESCROW_FINALIZED"
  | "SIMULATION_STARTED"
  | "SIMULATION_COMPLETE"
  | "ESCROW_ANOMALY_DETECTED"
  | "EXECUTION_BLOCKED_DIVERGENCE"   
  | "ENTITY_RESOLUTION_FAILED"      
  | "UNHANDLED_PIPELINE_ERROR" 
  | "EXECUTION_REJECTED_BY_ETK"
  | "ETK_DECISION"
  | "ETK_INTENT_DECISION"
  | "INTENT_REJECTED_BY_ETK"
  | "INTENT_COMMITTED"
  | "EXECUTION_INTENT_EMITTED"

export type ExecutionTraceRecord = {
  id: string
  timestamp: number

  type: TraceEventType

  eventType?: string
  domain?: string

  payload?: any

  result?: any

  metadata?: {
    streamId?: string
    correlationId?: string
    riskLevel?: string
    blockNumber?: number
    simulationId?: string
  }
}

export class ExecutionTraceLedger {
  private traces: ExecutionTraceRecord[] = []

  append(record: ExecutionTraceRecord) {
    this.traces.push(record)

    // lightweight memory guard
    if (this.traces.length > 5000) {
      this.traces.shift()
    }
  }

  getAll() {
    return this.traces
  }

  getByCorrelation(id: string) {
    return this.traces.filter(t => t.metadata?.correlationId === id)
  }

  getLatest(n = 50) {
    return this.traces.slice(-n)
  }
}

export const executionTraceLedger = new ExecutionTraceLedger()
