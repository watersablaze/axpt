import type {
  ExecutionSignal,
  ExecutionSignalSource,
} from "@/engines/contracts/ExecutionContracts"

export type AuthoritySpineContract = {
  entityId: string

  reality: {
    risk: number
    drift: number
    stability: number
    confidence: number
  }

  governance: {
    decision: "ALLOW" | "QUARANTINE"
  }

  ctx?: unknown
}

export class AuthoritySpineCompiler {
  build(
    signals: ExecutionSignal[],
    entityId: string,
    ctx?: unknown
  ): AuthoritySpineContract {
    const risk = this.pick(signals, "RISK")
    const drift = this.pick(signals, "DRIFT")
    const stability = this.deriveStability(signals)

    return {
      entityId,

      reality: {
        risk,
        drift,
        stability,
        confidence: this.avgConfidence(signals),
      },

      governance: {
        decision: this.shouldQuarantine({ risk, drift, stability })
          ? "QUARANTINE"
          : "ALLOW",
      },

      ctx,
    }
  }

  private pick(
    signals: ExecutionSignal[],
    source: ExecutionSignalSource
  ): number {
    const signal = signals.find((item) => item.source === source)
    return signal?.severity ?? 0
  }

  private deriveStability(signals: ExecutionSignal[]): number {
    const finality = signals.find((item) => item.source === "FINALITY")

    if (finality) {
      return this.clamp01(1 - finality.severity)
    }

    const risk = this.pick(signals, "RISK")
    const drift = this.pick(signals, "DRIFT")
    const divergence = this.pick(signals, "DIVERGENCE")

    return this.clamp01(1 - risk * 0.4 - drift * 0.35 - divergence * 0.25)
  }

  private shouldQuarantine(input: {
    risk: number
    drift: number
    stability: number
  }): boolean {
    return input.risk > 0.9 || input.drift > 0.9 || input.stability < 0.35
  }

  private avgConfidence(signals: ExecutionSignal[]): number {
    if (!signals.length) return 0.5

    return this.clamp01(
      signals.reduce((sum, signal) => sum + signal.confidence, 0) /
        signals.length
    )
  }

  private clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const authoritySpineCompiler = new AuthoritySpineCompiler()