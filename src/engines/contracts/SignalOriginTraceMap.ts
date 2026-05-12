import type { ExecutionSignalSource } from "./ExecutionContracts"

type SignalTrustTarget = ExecutionSignalSource | "ETK"

export type SignalOriginNode = {
  source: ExecutionSignalSource
  emits: string[]
  trustedBy: SignalTrustTarget[]
  blockedBy: SignalTrustTarget[]
}

export const SIGNAL_ORIGIN_TRACE_MAP: SignalOriginNode[] = [
  {
    source: "RECONCILIATION",
    emits: ["DRIFT", "CONSISTENT"],
    trustedBy: ["ETK"],
    blockedBy: ["GOVERNANCE"],
  },
  {
    source: "REPLAY",
    emits: ["VALID", "INVALID"],
    trustedBy: ["ETK", "DIVERGENCE"],
    blockedBy: [],
  },
  {
    source: "DIVERGENCE",
    emits: ["CRITICAL", "MISMATCH", "MATCH"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
  {
    source: "GOVERNANCE",
    emits: ["ALLOW", "REJECT", "POLICY"],
    trustedBy: ["ETK"],
    blockedBy: ["SIMULATION"],
  },
  {
    source: "RISK",
    emits: ["RISK", "TREASURY_RISK"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
  {
    source: "SIMULATION",
    emits: ["COLLAPSE_PREDICTION"],
    trustedBy: ["ETK"],
    blockedBy: ["GOVERNANCE"],
  },
  {
    source: "DRIFT",
    emits: ["TEMPORAL_DRIFT"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
  {
    source: "FINALITY",
    emits: ["TEMPORAL_FINALITY"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
  {
    source: "COGNITION",
    emits: ["OPERATOR_FIELD"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
  {
    source: "SYSTEM",
    emits: ["OPERATOR_FIELD"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
]
