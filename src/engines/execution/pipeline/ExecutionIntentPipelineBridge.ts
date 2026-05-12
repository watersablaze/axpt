import crypto from "crypto"
import {
  executionIntentBus,
  type ExecutionIntentType,
} from "@/engines/execution/bus/ExecutionIntentBus"
import type { ExecutionDecision } from "@/engines/contracts/ExecutionContracts"

export class ExecutionIntentPipelineBridge {

  /**
   * 🧠 ONLY ENTRY POINT
   */
  commit(entityId: string, decision: ExecutionDecision, payload?: any) {

    if (decision.status !== "COMMIT") return null

    const intent = {
      type: this.mapDecisionToIntent(payload),
      escrowId: entityId,

      proofPackHash: payload?.proofHash ?? "NONE",
      snapshotHash: payload?.snapshotHash ?? "NONE",
      replayHash: payload?.replayHash ?? "NONE",

      severity: this.mapRisk(payload?.riskLevel),

      payload,
    }

    return executionIntentBus.emit(intent)
  }

  // ─────────────────────────────
  // MAPPERS
  // ─────────────────────────────

  private mapDecisionToIntent(payload: any): ExecutionIntentType {
    if (payload?.collapseRisk > 0.85) return "ESCROW_REFUND"
    if (payload?.riskLevel > 0.6) return "LIQUIDITY_REBALANCE"
    if (payload?.replayState === "SETTLED") return "ESCROW_FINALIZE"

    return "ESCROW_RELEASE"
  }

  private mapRisk(risk: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (risk > 0.85) return "CRITICAL"
    if (risk > 0.6) return "HIGH"
    if (risk > 0.3) return "MEDIUM"
    return "LOW"
  }
}

export const executionIntentBridge =
  new ExecutionIntentPipelineBridge()
