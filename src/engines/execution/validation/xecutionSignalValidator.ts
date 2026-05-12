import type {
  ExecutionSignal,
  ExecutionSignalSource,
} from "@/engines/contracts/ExecutionContracts"

const VALID_SOURCES: ExecutionSignalSource[] = [
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

export class ExecutionSignalValidator {

  /**
   * 🧠 STRICT INPUT GUARD
   */
  validate(signal: ExecutionSignal): ExecutionSignal | null {

    // ─────────────────────────────
    // 1. SOURCE VALIDATION
    // ─────────────────────────────
    if (!VALID_SOURCES.includes(signal.source)) {
      return null
    }

    // ─────────────────────────────
    // 2. SEVERITY SANITIZATION
    // ─────────────────────────────
    const severity =
      typeof signal.severity === "number"
        ? Math.max(0, Math.min(1, signal.severity))
        : 0

    // ─────────────────────────────
    // 3. CONFIDENCE SANITIZATION
    // ─────────────────────────────
    const confidence =
      typeof signal.confidence === "number"
        ? Math.max(0, Math.min(1, signal.confidence))
        : 0.5

    // ─────────────────────────────
    // 4. PAYLOAD SAFETY (NO MUTATION)
    // ─────────────────────────────
    const payload = signal.payload ?? null

    return {
      source: signal.source,
      type: signal.type ?? "UNKNOWN",
      severity,
      confidence,
      timestamp: signal.timestamp ?? Date.now(),
      payload,
    }
  }

  /**
   * 🧠 BATCH FILTER FOR ETK
   */
  filter(signals: ExecutionSignal[]) {
    return signals
      .map(s => this.validate(s))
      .filter(Boolean) as ExecutionSignal[]
  }
}

export const executionSignalValidator =
  new ExecutionSignalValidator()