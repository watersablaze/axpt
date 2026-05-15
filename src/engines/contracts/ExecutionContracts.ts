export const EXECUTION_VERSION = "1.0.0"

export type ExecutionSignalSource =
  | "INTENT"
  | "REPLAY"
  | "GOVERNANCE"
  | "FINALITY"
  | "SIMULATION"
  | "TREASURY"
  | "SYSTEM"

export type ExecutionSignal = {
  source: ExecutionSignalSource
  type: string
  severity: number
  confidence: number
  timestamp: number
  payload?: unknown
  entityId?: string
}

export type ExecutionDecision =
  | {
      status: "ALLOW"
      confidence: number
      traceId: string
    }
  | {
      status: "BLOCK" | "REJECT"
      reason: string
      confidence: number
      traceId: string
    }