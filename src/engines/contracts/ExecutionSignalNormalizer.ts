import type { ExecutionSignal } from "./ExecutionContracts"

/**
 * 🧠 PURPOSE:
 * Converts ALL engine signals into ETK-safe canonical form
 */
export class ExecutionSignalNormalizer {

  normalize(signals: ExecutionSignal[]): ExecutionSignal[] {
    return signals
      .map((s) => this.normalizeSignal(s))
      .filter(Boolean) as ExecutionSignal[]
  }

  private normalizeSignal(signal: ExecutionSignal): ExecutionSignal | null {

    if (!signal) return null

    // ─────────────────────────────
    // 1. STRIP LEGACY FIELDS
    // ─────────────────────────────

    const clean: ExecutionSignal = {
      source: signal.source,
      type: signal.type,
      severity: this.clamp(signal.severity),
      confidence: this.clamp(signal.confidence),
      timestamp: signal.timestamp ?? Date.now(),
      decision: signal.decision,
      state: signal.state,
      replayState: signal.replayState,
      payload: signal.payload ?? null,
    }

    // ─────────────────────────────
    // 2. MIGRATION RULES (LEGACY COMPATIBILITY)
    // ─────────────────────────────

    // state → payload migration
    if ((signal as any).state) {
      clean.payload = {
        ...(typeof clean.payload === "object" ? clean.payload : {}),
        state: (signal as any).state,
      }
    }

    // decision → governance hint ONLY (never authoritative)
    if ((signal as any).decision) {
      clean.payload = {
        ...(typeof clean.payload === "object" ? clean.payload : {}),
        legacyDecision: (signal as any).decision,
      }
    }

    // type safety fallback
    if (!clean.type) {
      clean.type = "UNKNOWN_SIGNAL"
    }

    return clean
  }

  private clamp(value?: number) {
    if (value === undefined || value === null) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const executionSignalNormalizer =
  new ExecutionSignalNormalizer()
