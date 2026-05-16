export const EXECUTION_VERSION = "1.0.0"

export type ExecutionSignalSource =
  | "COGNITION"
  | "DRIFT"
  | "RISK"
  | "RECONCILIATION"
  | "DIVERGENCE"
  | "WALLET"
  | "TREASURY"
  | "ETK"
  | "INTENT"
  | "REPLAY"
  | "FINALITY"
  | "SIMULATION"
  | "SYSTEM"
  | "GOVERNANCE"

export type ExecutionSignal = {
  id: string
  source: ExecutionSignalSource
  entityId: string
  severity: number
  confidence: number
  timestamp: number
}

export type ExecutionDecision =
  | { status: "ALLOW"; confidence?: number; traceId?: string }
  | { status: "BLOCK" | "REJECT"; reason: string; confidence?: number; traceId?: string }