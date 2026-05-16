import type {
  ExecutionSignal,
  ExecutionSignalSource,
} from "./ExecutionContracts"

export const SIGNAL_SOURCE_REGISTRY = [
  "COGNITION",
  "DRIFT",
  "RISK",
  "RECONCILIATION",
  "DIVERGENCE",
  "WALLET",
  "TREASURY",
  "ETK",
  "INTENT",
  "REPLAY",
  "FINALITY",
  "SIMULATION",
  "SYSTEM",
  "GOVERNANCE",
] as const satisfies readonly ExecutionSignalSource[]

export function isExecutionSignalSource(
  value: unknown
): value is ExecutionSignalSource {
  return (
    typeof value === "string" &&
    SIGNAL_SOURCE_REGISTRY.includes(value as ExecutionSignalSource)
  )
}

export function isExecutionSignal(value: unknown): value is ExecutionSignal {
  if (!value || typeof value !== "object") return false

  const signal = value as Partial<Record<keyof ExecutionSignal, unknown>>

  return (
    typeof signal.id === "string" &&
    signal.id.length > 0 &&
    isExecutionSignalSource(signal.source) &&
    typeof signal.entityId === "string" &&
    signal.entityId.length > 0 &&
    typeof signal.severity === "number" &&
    Number.isFinite(signal.severity) &&
    signal.severity >= 0 &&
    signal.severity <= 1 &&
    typeof signal.confidence === "number" &&
    Number.isFinite(signal.confidence) &&
    signal.confidence >= 0 &&
    signal.confidence <= 1 &&
    typeof signal.timestamp === "number" &&
    Number.isFinite(signal.timestamp)
  )
}

export function assertValidSignal(signal: unknown): asserts signal is ExecutionSignal {
  if (!isExecutionSignal(signal)) {
    throw new Error("INVALID_EXECUTION_SIGNAL")
  }
}

export function assertSignalBatch(
  signals: unknown[]
): asserts signals is ExecutionSignal[] {
  for (const signal of signals) {
    assertValidSignal(signal)
  }
}