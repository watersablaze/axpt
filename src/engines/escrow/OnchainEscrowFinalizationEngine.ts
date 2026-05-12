import crypto from "crypto"
import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"
import { writeProof } from "@/engines/ledger/writeProof"

type ChainEscrowEvent = {
  escrowId: string
  txHash: string
  blockNumber: number
  status: "CONFIRMED" | "FAILED"
  from: string
  to: string
  amount: number
}

export class OnchainEscrowFinalizationEngine {
  private finalizedEscrows = new Set<string>()

  /**
   * ⛓️ ENTRY POINT FROM EXECUTION STREAM
   */
  handleChainConfirmation(event: ChainEscrowEvent) {

    // 1. idempotency guard
    if (this.finalizedEscrows.has(event.escrowId)) return

    // 2. mark finalization
    this.finalizedEscrows.add(event.escrowId)

    // 3. write immutable proof
    writeProof({
      type: "ESCROW_FINALIZED_ONCHAIN",
      payload: event,
      sourceNodeId: event.txHash,
    })

    // 4. trace ledger (audit layer)
    executionTraceLedger.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "ONCHAIN_ESCROW_FINALIZED",
      payload: event,
      metadata: {
        blockNumber: event.blockNumber,
      },
    })
  }

  /**
   * 🔍 FINALITY CHECK (used by reconciliation layer)
   */
  isFinal(escrowId: string) {
    return this.finalizedEscrows.has(escrowId)
  }
}

export const onchainEscrowFinalizationEngine =
  new OnchainEscrowFinalizationEngine()
