import type { ExecutionIntent } from "@/engines/core/types/ExecutionIntent"
import { governorEngine } from "@/engines/governance/AXPTGovernorEngine"
import { lockEscrowOnChain } from "./chain/axgEscrowClient"

import { AXPTExecutionStateMachine } from "@/engines/safety/AXPTExecutionStateMachine"
import { createExecutionFingerprint } from "@/engines/safety/AXPTExecutionFingerprint"
import { circuitBreakerEngine } from "@/engines/safety/AXPTCircuitBreakerEngine"
import { organismSnapshotLock } from "@/engines/safety/AXPTOrganismSnapshotLock"
import { createReceipt } from "@/engines/safety/AXPTExecutionReceipt"
import { eventBus } from "@/engines/events/AXPTEventBus"

/**
 * 🧠 AXPT EXECUTION ENGINE (REAL ROUTER)
 */
export class AXPTExecutionEngine {

  async execute(intent: ExecutionIntent) {

    eventBus.emitEvent("execution_started", intent)

    // ──────────────────────────────
    // 1. CIRCUIT BREAKER HARD STOP
    // ──────────────────────────────
    if (circuitBreakerEngine.getMode() === "LOCKDOWN") {
      return { status: "BLOCKED_SYSTEM_LOCKDOWN" }
    }

    // ──────────────────────────────
    // 2. GOVERNOR VALIDATION
    // ──────────────────────────────
    const decision = governorEngine.evaluate(intent)

    if (!decision.allowed) {
      return {
        status: "BLOCKED_BY_GOVERNOR",
        reason: decision.reason,
      }
    }

    const finalIntent: ExecutionIntent = {
      ...intent,
      suggestedMode: decision.modeOverride ?? intent.suggestedMode,
    }

    // ──────────────────────────────
    // 3. STATE MACHINE INIT
    // ──────────────────────────────
    const stateMachine = new AXPTExecutionStateMachine()
    stateMachine.transition("VALIDATED")

    // ──────────────────────────────
    // 4. ORGANISM SNAPSHOT LOCK
    // ──────────────────────────────
    const locked = organismSnapshotLock.getLocked?.()

    // ──────────────────────────────
    // 5. EXECUTION FINGERPRINT
    // ──────────────────────────────
    const fingerprint = createExecutionFingerprint({
      from: finalIntent.fromUserId,
      to: finalIntent.toUserId,
      assetCode: finalIntent.assetCode,
      amount: finalIntent.amountBaseUnits,
      organismHash: locked?.timestamp?.toString() ?? "0",
      nonce: Date.now(),
    })

    stateMachine.transition("APPROVED")

    // ──────────────────────────────
    // 6. ROUTING
    // ──────────────────────────────
    let result: any

    switch (finalIntent.suggestedMode ?? "TRANSFER") {

      case "ESCROW":
        result = await this.routeEscrow(finalIntent)
        break

      case "TRANSFER":
        result = await this.transfer(finalIntent)
        break

      case "REJECT":
        return { status: "REJECTED", intent: finalIntent }

      case "QUARANTINE":
        return { status: "QUARANTINED", intent: finalIntent }

      default:
        throw new Error("INVALID_MODE")
    }

    stateMachine.transition("ONCHAIN_CONFIRMED")

    // ──────────────────────────────
    // 7. RECEIPT GENERATION
    // ──────────────────────────────
    return createReceipt({
      intentId: fingerprint,

      stateBefore: "APPROVED",
      stateAfter: result.status ?? "EXECUTED",

      chainTxHash: result.transactionHash ?? null,

      reconciliationHash: result.reconciliationHash ?? undefined,

      failureReason: undefined,

      timestamp: Date.now(),
    })
  }

  /**
   * 🔒 ESCROW ON-CHAIN EXECUTION
   */
private async routeEscrow(intent: ExecutionIntent) {
  const caseId = this.toCaseId(intent)

  const result = await lockEscrowOnChain({
    caseId,
    from: intent.fromUserId as `0x${string}`,
    to: intent.toUserId as `0x${string}`,
    amount: intent.amountBaseUnits,
  })

  const receipt = {
    status: "ESCROW_EXECUTED_ONCHAIN",
    transactionHash: result.transactionHash,
    caseId,
  }

  eventBus.emit({
    type: "ESCROW_UPDATED",
    payload: receipt,
  })

  return receipt
}

  /**
   * ⚡ FUTURE TRANSFER PATH
   */
  private async transfer(intent: ExecutionIntent) {
    return {
      status: "TRANSFER_PENDING_ONCHAIN",
      intent,
    }
  }

  private toCaseId(intent: ExecutionIntent): `0x${string}` {
    const raw = `${intent.fromUserId}-${intent.toUserId}-${intent.amountBaseUnits}`
    return `0x${Buffer.from(raw).toString("hex").slice(0, 32)}` as `0x${string}`
  }
}

export const executionEngine = new AXPTExecutionEngine()
