import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type AdversarialMode =
  | "CHAIN_REORG_ATTACK"
  | "ORACLE_MANIPULATION"
  | "GOVERNANCE_SPLIT_BRAIN"
  | "LATENCY_INJECTION"
  | "INTENT_REPLAY_ATTACK"
  | "STATE_DESYNCHRONIZATION"

type AdversarialConfig = {
  intensity: number // 0 → 1
  aggressiveness: "LOW" | "MEDIUM" | "HIGH"
}

export class ExecutionAdversarialLayer {

  simulate(
    signals: ExecutionSignal[],
    mode: AdversarialMode,
    config: AdversarialConfig = {
      intensity: 0.4,
      aggressiveness: "MEDIUM",
    }
  ): ExecutionSignal[] {

    switch (mode) {

      case "CHAIN_REORG_ATTACK":
        return this.chainReorg(signals, config)

      case "ORACLE_MANIPULATION":
        return this.oracleManipulation(signals, config)

      case "GOVERNANCE_SPLIT_BRAIN":
        return this.splitBrain(signals, config)

      case "LATENCY_INJECTION":
        return this.latencyInjection(signals, config)

      case "INTENT_REPLAY_ATTACK":
        return this.intentReplay(signals, config)

      case "STATE_DESYNCHRONIZATION":
        return this.stateDesync(signals, config)

      default:
        return signals
    }
  }

  // ─────────────────────────────
  // ⛓ CHAIN REORG ATTACK
  // ─────────────────────────────
  private chainReorg(signals: ExecutionSignal[], cfg: AdversarialConfig) {
    return signals.map(s =>
      s.source === "FINALITY"
        ? {
            ...s,
            severity: Math.min(1, 0.7 + cfg.intensity),
            type: "REORG_INVALIDATED_FINALITY",
            confidence: Math.max(0.2, s.confidence - cfg.intensity),
          }
        : s
    )
  }

  // ─────────────────────────────
  // 🧮 ORACLE MANIPULATION
  // ─────────────────────────────
  private oracleManipulation(signals: ExecutionSignal[], cfg: AdversarialConfig) {
    return signals.map(s =>
      s.source === "RISK"
        ? {
            ...s,
            severity: Math.min(1, s.severity + cfg.intensity),
            type: "ORACLE_DEVIATION",
          }
        : s
    )
  }

  // ─────────────────────────────
  // 🧠 SPLIT BRAIN GOVERNANCE
  // ─────────────────────────────
  private splitBrain(signals: ExecutionSignal[], cfg: AdversarialConfig) {
    return signals.map(s =>
      s.source === "GOVERNANCE"
        ? {
            ...s,
            decision:
              (Math.random() > 0.5 ? "ALLOW" : "REJECT") as
                | "ALLOW"
                | "REJECT",
            confidence: Math.max(0.1, s.confidence - cfg.intensity),
            type: "CONFLICTING_POLICY_STATE",
          }
        : s
    )
  }

  // ─────────────────────────────
  // ⏳ LATENCY INJECTION
  // ─────────────────────────────
  private latencyInjection(signals: ExecutionSignal[], cfg: AdversarialConfig) {
    return signals.map(s =>
      s.source === "RECONCILIATION"
        ? {
            ...s,
            severity: s.severity + cfg.intensity * 0.3,
            type: "STALE_RECONCILIATION_STATE",
          }
        : s
    )
  }

  // ─────────────────────────────
  // 🔁 INTENT REPLAY ATTACK
  // ─────────────────────────────
  private intentReplay(signals: ExecutionSignal[], cfg: AdversarialConfig) {
    const replayed = signals.filter(s => s.source === "REPLAY")

    return [
      ...signals,
      ...replayed.map(r => ({
        ...r,
        type: "REPLAYED_INTENT_DUPLICATION",
        confidence: r.confidence - cfg.intensity,
      })),
    ]
  }

  // ─────────────────────────────
  // 🧩 STATE DESYNC
  // ─────────────────────────────
  private stateDesync(signals: ExecutionSignal[], cfg: AdversarialConfig) {
    return signals.map(s => ({
      ...s,
      type: s.source + "_DESYNCED",
      severity: Math.min(1, s.severity + cfg.intensity * 0.2),
    }))
  }
}

export const executionAdversarialLayer =
  new ExecutionAdversarialLayer()
