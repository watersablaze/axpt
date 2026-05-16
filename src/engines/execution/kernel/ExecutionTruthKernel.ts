import crypto from "crypto"

import type { AuthoritySpineContract } from "@/engines/operator/AuthoritySpineCompiler"

export type ETKDecision =
  | {
      status: "ALLOW"
      confidence: number
      traceId: string
    }
  | {
      status: "BLOCK" | "REJECT"
      reason: string
      confidence: number
      traceId: string
    }

export type ETKTrace = {
  traceId: string
  entityId: string
  metrics: {
    risk: number
    drift: number
    stability: number
    finalityScore: number
    collapseRisk: number
  }
  decidedAt: number
}

export type ETKGateResult = {
  decision: ETKDecision
  trace: ETKTrace
}

export class ExecutionTruthKernel {
  decide(spine: AuthoritySpineContract): ETKGateResult {
    const traceId = crypto.randomUUID()

    const { reality, governance } = spine

    const collapseRisk = this.clamp(
      reality.risk * 0.6 + reality.drift * 0.4
    )

    const finalityScore = this.clamp(
      1 - reality.risk * 0.5 - reality.drift * 0.3
    )

    const confidence = this.clamp(reality.confidence)

    const decision = this.buildDecision({
      governanceDecision: governance.decision,
      collapseRisk,
      risk: reality.risk,
      stability: reality.stability,
      confidence,
      traceId,
    })

    return {
      decision,
      trace: {
        traceId,
        entityId: spine.entityId,
        metrics: {
          risk: reality.risk,
          drift: reality.drift,
          stability: reality.stability,
          finalityScore,
          collapseRisk,
        },
        decidedAt: Date.now(),
      },
    }
  }

  private buildDecision(input: {
    governanceDecision: "ALLOW" | "QUARANTINE"
    collapseRisk: number
    risk: number
    stability: number
    confidence: number
    traceId: string
  }): ETKDecision {
    if (input.governanceDecision === "QUARANTINE") {
      return {
        status: "BLOCK",
        reason: "GOVERNANCE",
        confidence: input.confidence,
        traceId: input.traceId,
      }
    }

    if (input.collapseRisk > 0.85) {
      return {
        status: "BLOCK",
        reason: "COLLAPSE_RISK",
        confidence: input.confidence,
        traceId: input.traceId,
      }
    }

    if (input.risk > 0.9) {
      return {
        status: "BLOCK",
        reason: "RISK",
        confidence: input.confidence,
        traceId: input.traceId,
      }
    }

    if (input.stability < 0.6) {
      return {
        status: "REJECT",
        reason: "LOW_STABILITY",
        confidence: input.confidence,
        traceId: input.traceId,
      }
    }

    return {
      status: "ALLOW",
      confidence: input.confidence,
      traceId: input.traceId,
    }
  }

  private clamp(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const etk = new ExecutionTruthKernel()