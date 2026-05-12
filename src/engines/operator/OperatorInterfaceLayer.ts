// src/engines/operator/OperatorInterfaceLayer.ts

import { executionIntentBus } from "@/engines/execution/bus/ExecutionIntentBus"

export type OperatorIntent = {
  operatorId: string
  intentType: "EXECUTE" | "SIMULATE" | "QUERY" | "HOLD" | "RELEASE"
  entityId?: string
confidence: number
  riskTag: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  normalizedPayload: any
  timestamp: number
}

export class OperatorInterfaceLayer {

  /**
   * 🧠 ENTRY POINT
   */
  submit(raw: any): OperatorIntent {

    const intent: OperatorIntent = this.normalize(raw)

    this.validate(intent)

    this.forward(intent)

    return intent
  }

  // ─────────────────────────────
  // NORMALIZATION
  // ─────────────────────────────

  private normalize(raw: any): OperatorIntent {
    return {
      operatorId: raw.operatorId,
      intentType: raw.intentType ?? "QUERY",
      entityId: raw.entityId,
      confidence: raw.confidence ?? 0.5,
      riskTag: this.computeRisk(raw),
      normalizedPayload: raw.payload ?? {},
      timestamp: Date.now(),
    }
  }

  // ─────────────────────────────
  // RISK CLASSIFIER
  // ─────────────────────────────

  private computeRisk(raw: any): OperatorIntent["riskTag"] {
    if (raw.intentType === "EXECUTE" && raw.amount > 10000) {
      return "CRITICAL"
    }
    if (raw.intentType === "EXECUTE") return "HIGH"
    return "LOW"
  }

  // ─────────────────────────────
  // VALIDATION
  // ─────────────────────────────

  private validate(intent: OperatorIntent) {
    if (!intent.operatorId) {
      throw new Error("OPERATOR_ID_REQUIRED")
    }
  }

  // ─────────────────────────────
  // FORWARD TO SYSTEM
  // ─────────────────────────────

  private forward(intent: OperatorIntent) {

    executionIntentBus.emit({
      type: this.mapIntent(intent.intentType),
      escrowId: intent.entityId ?? "global",
      proofPackHash: "",
      snapshotHash: "",
      replayHash: "",
      severity: intent.riskTag,
      payload: intent.normalizedPayload,
    })
  }

  // ─────────────────────────────
  // MAPPING
  // ─────────────────────────────

  private mapIntent(type: OperatorIntent["intentType"]) {
    switch (type) {
      case "EXECUTE": return "ESCROW_FINALIZE"
      case "RELEASE": return "ESCROW_RELEASE"
      case "HOLD": return "LIQUIDITY_REBALANCE"
      default: return "LIQUIDITY_REBALANCE"
    }
  }
}