import { runtimeBus } from "@/engines/runtime/serverSingletons"

type EscrowIntent = {
  escrowId: string
  amount: number
  from: string
  to: string
}

type ChainConfirmation = {
  escrowId: string
  amount: string
  txHash: string
}

export class EscrowReconciliationEngine {
  private intents = new Map<string, EscrowIntent>()
  private confirmations = new Map<string, ChainConfirmation>()

  /**
   * 🧾 STORE INTENT (offchain)
   */
  registerIntent(intent: EscrowIntent) {
    this.intents.set(intent.escrowId, intent)
  }

  /**
   * 🔗 RECEIVE CHAIN EVENT
   */
  handleChainEvent(event: any) {
    const confirmation: ChainConfirmation = {
      escrowId: event.escrowId,
      amount: event.amount,
      txHash: event.txHash,
    }

    this.confirmations.set(event.escrowId, confirmation)

    this.reconcile(event.escrowId)
  }

  /**
   * ⚖️ RECONCILIATION CORE
   */
  private reconcile(escrowId: string) {
    const intent = this.intents.get(escrowId)
    const chain = this.confirmations.get(escrowId)

    if (!intent || !chain) return

    const matched =
      Number(chain.amount) === intent.amount

    const proof = {
      escrowId,
      status: matched ? "VERIFIED" : "MISMATCH",
      intent,
      chain,
      timestamp: Date.now(),
    }

    runtimeBus.emit({
      type: "ESCROW_RECONCILIATION_PROOF",
      ...proof,
    })
  }
}

export const escrowReconciliationEngine =
  new EscrowReconciliationEngine()