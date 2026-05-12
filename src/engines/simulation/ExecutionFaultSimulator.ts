import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type ExecutionFaultType =
  | "DRIFT_AMPLIFICATION"
  | "DIVERGENCE_SPIKE"
  | "FINALITY_DELAY"
  | "REPLAY_CORRUPTION"
  | "GOVERNANCE_FLIP"
  | "RISK_NOISE_INJECTION"

type FaultConfig = {
  intensity: number // 0 → 1
  mode: "SAFE" | "STRESS" | "CHAOS"
}

export class ExecutionFaultSimulator {

  simulate(
    signals: ExecutionSignal[],
    fault?: ExecutionFaultType,
    config: FaultConfig = { intensity: 0.3, mode: "SAFE" }
  ): ExecutionSignal[] {

    if (!fault) return signals

    switch (fault) {

      case "DRIFT_AMPLIFICATION":
        return this.amplifyDrift(signals, config.intensity)

      case "DIVERGENCE_SPIKE":
        return this.injectDivergence(signals, config.intensity)

      case "FINALITY_DELAY":
        return this.delayFinality(signals, config.intensity)

      case "REPLAY_CORRUPTION":
        return this.corruptReplay(signals, config.intensity)

      case "GOVERNANCE_FLIP":
        return this.flipGovernance(signals, config.intensity)

      case "RISK_NOISE_INJECTION":
        return this.injectRiskNoise(signals, config.intensity)

      default:
        return signals
    }
  }

  // ─────────────────────────────
  // 🧠 DRIFT AMPLIFICATION
  // ─────────────────────────────
  private amplifyDrift(signals: ExecutionSignal[], intensity: number) {
    return signals.map(s =>
      s.source === "DRIFT"
        ? { ...s, severity: Math.min(1, s.severity + intensity) }
        : s
    )
  }

  // ─────────────────────────────
  // ⚠️ DIVERGENCE SPIKE
  // ─────────────────────────────
  private injectDivergence(signals: ExecutionSignal[], intensity: number) {
    return signals.map(s =>
      s.source === "DIVERGENCE"
        ? { ...s, severity: Math.min(1, 0.5 + intensity) }
        : s
    )
  }

  // ─────────────────────────────
  // ⏳ FINALITY DELAY SIMULATION
  // ─────────────────────────────
  private delayFinality(signals: ExecutionSignal[], intensity: number) {
    return signals.map(s =>
      s.source === "FINALITY"
        ? {
            ...s,
            severity: Math.min(1, s.severity + intensity * 0.5),
            confidence: s.confidence - intensity * 0.3,
          }
        : s
    )
  }

  // ─────────────────────────────
  // 🔁 REPLAY CORRUPTION
  // ─────────────────────────────
  private corruptReplay(signals: ExecutionSignal[], intensity: number) {
    return signals.map(s =>
      s.source === "REPLAY"
        ? {
            ...s,
            severity: Math.min(1, 0.3 + intensity),
            state: "CORRUPTED_STATE",
          }
        : s
    )
  }

  // ─────────────────────────────
  // ⚖️ GOVERNANCE FLIP
  // ─────────────────────────────
  private flipGovernance(signals: ExecutionSignal[], intensity: number) {
    return signals.map(s =>
      s.source === "GOVERNANCE"
        ? {
            ...s,
            decision: (Math.random() > 0.5 ? "ALLOW" : "REJECT") as
              | "ALLOW"
              | "REJECT",
            confidence: Math.max(0.2, s.confidence - intensity),
          }
        : s
    )
  }

  // ─────────────────────────────
  // 📉 RISK NOISE INJECTION
  // ─────────────────────────────
  private injectRiskNoise(signals: ExecutionSignal[], intensity: number) {
    return signals.map(s =>
      s.source === "RISK"
        ? {
            ...s,
            severity: Math.min(1, s.severity + intensity),
          }
        : s
    )
  }
}

export const executionFaultSimulator =
  new ExecutionFaultSimulator()
