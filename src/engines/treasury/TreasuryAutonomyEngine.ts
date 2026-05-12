import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type TreasuryAction =
  | "ESCROW_RELEASE"
  | "ESCROW_REFUND"
  | "LIQUIDITY_REBALANCE"
  | "ONCHAIN_FINALIZE"
  | "HOLD"

type TreasuryExecutionInput = {
  proofPack: any
  snapshot: any
  governance: any
  divergence: any
}

export class TreasuryAutonomyEngine {
  riskSignal(entityId: string): ExecutionSignal {
    return {
      source: "RISK",
      type: "TREASURY_DEFAULT_RISK",
      severity: 0,
      confidence: 1,
      timestamp: Date.now(),
      payload: { entityId },
    }
  }

  /**
   * Compatibility entry point. Treasury proposes; ETK executes.
   */
  execute(input: TreasuryExecutionInput) {
    return this.propose(input)
  }

  propose(input: TreasuryExecutionInput) {
    const { proofPack, snapshot, governance, divergence } = input

    if (divergence?.severity === "CRITICAL") {
      return { action: "HOLD" as TreasuryAction, reason: "DIVERGENCE_SIGNAL" }
    }

    if (!governance?.allowed) {
      return { action: "HOLD" as TreasuryAction, reason: "GOVERNANCE_SIGNAL" }
    }

    if (!proofPack?.escrowId) {
      return { action: "HOLD" as TreasuryAction, reason: "INVALID_PROOF_PACK" }
    }

    return {
      action: this.resolveAction(proofPack, snapshot),
      escrowId: proofPack.escrowId,
    }
  }

  /**
   * 🧠 DECISION ENGINE (DETERMINISTIC RULES ONLY)
   */
  private resolveAction(proofPack: any, snapshot: any): TreasuryAction {
    const replay = proofPack.replay?.finalState
    const chain = proofPack.chainState

    // strongest finality condition
    if (replay === "SETTLED" && chain === "FUNDS_LOCKED") {
      return "ONCHAIN_FINALIZE"
    }

    if (replay === "RELEASED") {
      return "ESCROW_RELEASE"
    }

    if (replay === "CANCELLED") {
      return "ESCROW_REFUND"
    }

    if (snapshot?.execution?.pending > 10) {
      return "LIQUIDITY_REBALANCE"
    }

    return "HOLD"
  }
}

export const treasuryAutonomyEngine = new TreasuryAutonomyEngine()
