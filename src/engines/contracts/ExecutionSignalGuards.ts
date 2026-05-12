import type { ExecutionSignal, ExecutionSignalSource } from "./ExecutionContracts"

/**
 * 🧠 SOURCE REGISTRY
 * Signal type remains an open string during Phase 1 contract stabilization.
 */
export const SIGNAL_SOURCE_REGISTRY: ExecutionSignalSource[] = [
  "INTENT",
  "REPLAY",
  "GOVERNANCE",
  "FINALITY",
  "SIMULATION",
  "TREASURY",
  "SYSTEM",
  "COGNITION",
  "DRIFT",
  "RISK",
  "RECONCILIATION",
  "DIVERGENCE",
]

/**
 * 🧱 HARD VALIDATION GUARD
 */
export function assertValidSignal(signal: ExecutionSignal) {
  if (!SIGNAL_SOURCE_REGISTRY.includes(signal.source)) {
    throw new Error(`INVALID_SIGNAL_SOURCE: ${signal.source}`)
  }

  if (!signal.type) {
    throw new Error(`MISSING_SIGNAL_TYPE`)
  }

  if (signal.severity < 0 || signal.severity > 1) {
    throw new Error(`SEVERITY_OUT_OF_RANGE`)
  }

  if (signal.confidence < 0 || signal.confidence > 1) {
    throw new Error(`CONFIDENCE_OUT_OF_RANGE`)
  }

  return true
}

/**
 * 🧠 BATCH VALIDATION (used by ETK ingestion)
 */
export function assertSignalBatch(signals: ExecutionSignal[]) {
  for (const s of signals) {
    assertValidSignal(s)
  }
  return true
}
