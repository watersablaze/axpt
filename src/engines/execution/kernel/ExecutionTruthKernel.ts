import crypto from "crypto"
import type { AuthoritySpineContract } from "@/engines/operator/AuthoritySpineCompiler"

export class ExecutionTruthKernel {

  decide(spine: AuthoritySpineContract) {
    const traceId = crypto.randomUUID()

    const { reality, governance } = spine

    const collapseRisk =
      this.clamp(reality.risk * 0.6 + reality.drift * 0.4)

    const finalityScore =
      this.clamp(1 - reality.risk * 0.5 - reality.drift * 0.3)

    const confidence = reality.confidence

    const decision =
      governance.decision === "QUARANTINE"
        ? { status: "BLOCK", reason: "GOVERNANCE" }
        : collapseRisk > 0.85
        ? { status: "BLOCK", reason: "COLLAPSE_RISK" }
        : reality.risk > 0.9
        ? { status: "BLOCK", reason: "RISK" }
        : reality.stability < 0.6
        ? { status: "REJECT", reason: "LOW_STABILITY" }
        : { status: "ALLOW" }

    return {
      decision: {
        ...decision,
        confidence,
        traceId,
      },
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

  private clamp(v: number) {
    return Math.max(0, Math.min(1, v))
  }
}

export const etk = new ExecutionTruthKernel()