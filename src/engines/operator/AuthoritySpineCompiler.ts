import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

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

    const risk = this.pick(signals, "risk")
    const drift = this.pick(signals, "drift")
    const stability = this.pick(signals, "finality")

    return {
      entityId,

      reality: {
        risk,
        drift,
        stability,
        confidence: this.avgConfidence(signals),
      },

      governance: {
        decision: this.hasReject(signals)
          ? "QUARANTINE"
          : "ALLOW",
      },

      ctx,
    }
  }

  private pick(signals: ExecutionSignal[], key: string) {
    const s = signals.find(x => x.type.toLowerCase().includes(key))
    return s?.severity ?? 0
  }

  private avgConfidence(signals: ExecutionSignal[]) {
    if (!signals.length) return 0.5
    return signals.reduce((a, b) => a + b.confidence, 0) / signals.length
  }

  private hasReject(signals: ExecutionSignal[]) {
    return signals.some(s => s.decision === "REJECT")
  }
}

export const authoritySpineCompiler = new AuthoritySpineCompiler()