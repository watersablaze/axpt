import crypto from "crypto"

import type { EscrowFinalizationProofPack } from "../escrow/EscrowFinalizationProofPack"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

export class ExecutionFinalityIndex {
  /**
   * PRIMARY OUTPUT → ETK SIGNAL
   *
   * Emits canonical ExecutionSignal only:
   * id, source, entityId, severity, confidence, timestamp
   */
  computeSignal(proof: EscrowFinalizationProofPack): ExecutionSignal {
    const replayConfidence = this.computeReplayConfidence(proof)
    const chainConfidence = this.computeChainConfidence(proof)
    const divergencePenalty = this.computeDivergencePenalty(proof.divergence)

    const finalityScore = this.clamp01(
      replayConfidence * 0.4 +
        chainConfidence * 0.4 +
        (1 - divergencePenalty) * 0.2
    )

    return {
      id: crypto.randomUUID(),
      source: "FINALITY",
      entityId: this.resolveEntityId(proof),
      severity: this.clamp01(1 - finalityScore),
      confidence: finalityScore,
      timestamp: Date.now(),
    }
  }

  private resolveEntityId(proof: EscrowFinalizationProofPack): string {
    return (
      this.readString(proof, "escrowId") ??
      this.readString(proof.replay, "escrowId") ??
      "UNKNOWN_ESCROW"
    )
  }

  private computeReplayConfidence(proof: EscrowFinalizationProofPack): number {
    switch (proof.replay?.finalState) {
      case "SETTLED":
        return 1
      case "RELEASED":
        return 0.9
      case "ACTIVE":
        return 0.6
      case "DISPUTED":
        return 0.3
      default:
        return 0.2
    }
  }

  private computeChainConfidence(proof: EscrowFinalizationProofPack): number {
    if (proof.chainState === "FUNDS_LOCKED") return 0.9
    if (proof.chainState === "PENDING") return 0.5
    return 0.2
  }

  private computeDivergencePenalty(
    divergence: EscrowFinalizationProofPack["divergence"]
  ): number {
    switch (divergence?.severity) {
      case "CRITICAL":
        return 1
      case "HIGH":
        return 0.7
      case "MEDIUM":
        return 0.4
      default:
        return 0.1
    }
  }

  private readString(value: unknown, key: string): string | null {
    if (!value || typeof value !== "object") return null

    const record = value as Record<string, unknown>
    const field = record[key]

    return typeof field === "string" && field.length > 0 ? field : null
  }

  private clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const executionFinalityIndex = new ExecutionFinalityIndex()