export type ProofEventType =
  | "ESCROW_INTENT"
  | "CHAIN_CONFIRMATION"
  | "RECONCILIATION_PROOF"
  | "ESCROW_FINALIZED_ONCHAIN"
  | "FINALIZATION_PROOF_PACK"

type LedgerEntry = {
  id: string
  type: ProofEventType
  timestamp: number
  eventHash: string
  sourceNodeId?: string | null
  payload: any
}

export class ProofLedger {
  private entries: LedgerEntry[] = []

  append(entry: LedgerEntry) {
    this.entries.push(Object.freeze(entry))
  }

  getAll() {
    return this.entries
  }

  query(type: ProofEventType) {
    return this.entries.filter(e => e.type === type)
  }
}

export const proofLedger = new ProofLedger()
