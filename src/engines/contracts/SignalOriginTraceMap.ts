import type { ExecutionSignalSource } from "./ExecutionContracts"

export type SignalTrustActor =
  | "ETK"
  | "RECONCILIATION_ENGINE"
  | "TREASURY_ENGINE"
  | "WALLET_ENGINE"
  | "DRIFT_ENGINE"
  | "COGNITION_ENGINE"
  | "DIVERGENCE_ENGINE"

export type SignalOriginNode = {
  source: ExecutionSignalSource
  emits: readonly string[]
  trustedBy: readonly SignalTrustActor[]
  blockedBy: readonly SignalTrustActor[]
}

/**
 * SIGNAL ORIGIN TRACE MAP
 *
 * LAW:
 * Signals are observations only.
 * Signals are NOT decisions.
 * Signals are NOT state transitions.
 * Signals are NOT execution outcomes.
 *
 * trustedBy / blockedBy may only contain system actors,
 * never signal types.
 */
export const SIGNAL_ORIGIN_TRACE_MAP = [
  {
    source: "RECONCILIATION",
    emits: ["DRIFT_OBSERVED", "CONSISTENCY_OBSERVED"],
    trustedBy: ["ETK", "RECONCILIATION_ENGINE"],
    blockedBy: [],
  },
  {
    source: "DIVERGENCE",
    emits: ["VARIANCE_OBSERVED", "MISMATCH_OBSERVED", "MATCH_OBSERVED"],
    trustedBy: ["ETK", "DIVERGENCE_ENGINE", "RECONCILIATION_ENGINE"],
    blockedBy: [],
  },
  {
    source: "RISK",
    emits: ["RISK_OBSERVED", "TREASURY_RISK_OBSERVED"],
    trustedBy: ["ETK", "TREASURY_ENGINE"],
    blockedBy: [],
  },
  {
    source: "DRIFT",
    emits: ["TEMPORAL_DRIFT_OBSERVED", "STABILITY_VARIANCE_OBSERVED"],
    trustedBy: ["ETK", "DRIFT_ENGINE"],
    blockedBy: [],
  },
  {
    source: "COGNITION",
    emits: ["OPERATOR_FIELD_OBSERVED", "OPERATOR_ALIGNMENT_OBSERVED"],
    trustedBy: ["ETK", "COGNITION_ENGINE"],
    blockedBy: [],
  },
  {
    source: "TREASURY",
    emits: ["TREASURY_PRESSURE_OBSERVED", "LIQUIDITY_CONDITION_OBSERVED"],
    trustedBy: ["ETK", "TREASURY_ENGINE"],
    blockedBy: [],
  },
  {
    source: "WALLET",
    emits: ["BALANCE_CONDITION_OBSERVED", "TRANSFER_CONDITION_OBSERVED"],
    trustedBy: ["ETK", "WALLET_ENGINE"],
    blockedBy: [],
  },
  {
    source: "ETK",
    emits: ["DECISION_TRACE_OBSERVED", "CONFIDENCE_OBSERVED"],
    trustedBy: ["ETK"],
    blockedBy: [],
  },
] as const satisfies readonly SignalOriginNode[]