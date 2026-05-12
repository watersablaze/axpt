import type { EscrowFinalizationProofPack } from "../escrow/EscrowFinalizationProofPack"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

export class ExecutionFinalityIndex {

  /**
   * 🧠 PRIMARY OUTPUT → ETK SIGNAL
   */
  computeSignal(proof: EscrowFinalizationProofPack): ExecutionSignal {

    const replayConfidence = this.computeReplayConfidence(proof)
    const chainConfidence = this.computeChainConfidence(proof)
    const divergencePenalty = this.computeDivergencePenalty(proof.divergence)

    const finalityScore =
      replayConfidence * 0.4 +
      chainConfidence * 0.4 +
      (1 - divergencePenalty) * 0.2

    return {
      source: "REPLAY",
      type: this.mapState(finalityScore),
      severity: 1 - finalityScore,
      confidence: finalityScore,
      timestamp: Date.now(),
      state: proof.replay?.finalState,
      payload: proof,
    }
  }

  // ─────────────────────────────
  // INTERNAL SCORING
  // ─────────────────────────────

  private computeReplayConfidence(proof: any) {
    switch (proof.replay?.finalState) {
      case "SETTLED": return 1
      case "RELEASED": return 0.9
      case "ACTIVE": return 0.6
      case "DISPUTED": return 0.3
      default: return 0.2
    }
  }

  private computeChainConfidence(proof: any) {
    if (proof.chainState === "FUNDS_LOCKED") return 0.9
    if (proof.chainState === "PENDING") return 0.5
    return 0.2
  }

  private computeDivergencePenalty(divergence: any) {
    switch (divergence?.severity) {
      case "CRITICAL": return 1
      case "HIGH": return 0.7
      case "MEDIUM": return 0.4
      default: return 0.1
    }
  }

  private mapState(score: number) {
    if (score > 0.85) return "FINAL"
    if (score > 0.65) return "NEAR_FINALITY"
    if (score > 0.4) return "PENDING_FINALITY"
    return "UNSTABLE"
  }
}

export const executionFinalityIndex = new ExecutionFinalityIndex()