import crypto from "crypto"

import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type TreasuryAction =
  | "ESCROW_RELEASE"
  | "ESCROW_REFUND"
  | "LIQUIDITY_REBALANCE"
  | "ONCHAIN_FINALIZE"
  | "HOLD"

type TreasuryExecutionInput = {
  proofPack: unknown
  snapshot: unknown
  governance: unknown
  divergence: unknown
}

export class TreasuryAutonomyEngine {
  riskSignal(entityId: string): ExecutionSignal {
    return {
      id: crypto.randomUUID(),
      source: "RISK",
      entityId,
      severity: 0,
      confidence: 1,
      timestamp: Date.now(),
    }
  }

  /**
   * Compatibility entry point. Treasury proposes; ETK executes.
   */
  execute(input: TreasuryExecutionInput) {
    return this.propose(input)
  }

  propose(input: TreasuryExecutionInput) {
    const proofPack = this.asRecord(input.proofPack)
    const snapshot = this.asRecord(input.snapshot)
    const governance = this.asRecord(input.governance)
    const divergence = this.asRecord(input.divergence)

    if (divergence.severity === "CRITICAL") {
      return { action: "HOLD" as TreasuryAction, reason: "DIVERGENCE_SIGNAL" }
    }

    if (governance.allowed === false) {
      return { action: "HOLD" as TreasuryAction, reason: "GOVERNANCE_SIGNAL" }
    }

    const escrowId = this.readString(proofPack, "escrowId")

    if (!escrowId) {
      return { action: "HOLD" as TreasuryAction, reason: "INVALID_PROOF_PACK" }
    }

    return {
      action: this.resolveAction(proofPack, snapshot),
      escrowId,
    }
  }

  private resolveAction(
    proofPack: Record<string, unknown>,
    snapshot: Record<string, unknown>
  ): TreasuryAction {
    const replay = this.asRecord(proofPack.replay)
    const finalState = replay.finalState
    const chainState = proofPack.chainState
    const execution = this.asRecord(snapshot.execution)
    const pending = typeof execution.pending === "number" ? execution.pending : 0

    if (finalState === "SETTLED" && chainState === "FUNDS_LOCKED") {
      return "ONCHAIN_FINALIZE"
    }

    if (finalState === "RELEASED") {
      return "ESCROW_RELEASE"
    }

    if (finalState === "CANCELLED") {
      return "ESCROW_REFUND"
    }

    if (pending > 10) {
      return "LIQUIDITY_REBALANCE"
    }

    return "HOLD"
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {}
  }

  private readString(
    record: Record<string, unknown>,
    key: string
  ): string | null {
    const value = record[key]
    return typeof value === "string" && value.length > 0 ? value : null
  }
}

export const treasuryAutonomyEngine = new TreasuryAutonomyEngine()