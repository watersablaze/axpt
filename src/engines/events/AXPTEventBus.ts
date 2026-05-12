export type AXPTEventType =
  | 'TRANSFER_EXECUTED'
  | 'ESCROW_UPDATED'
  | 'SETTLEMENT_FINALIZED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_RESOLVED'
  | 'EXECUTION_PREVIEW'
  | 'SYSTEM_QUARANTINE_TRIGGERED'
  | 'RECONCILIATION_DRIFT_DETECTED'
  | 'RECONCILIATION_TICK'
  | 'LEDGER_HEAL_COMPLETED'
  | 'LEDGER_REPLAY_COMPLETED'
  | 'ESCROW_REBUILD_TRIGGERED'
  | 'EXECUTION_FINALIZED'
  | 'COHERENCE_BLOCKED'
  | 'GOVERNANCE_EVALUATION_COMPLETED'
  | 'TREASURY_ESCROW_INITIATED'
  | 'CHAIN_ESCROW_CONFIRMED'
  | 'ESCROW_RECONCILIATION_PROOF'
  | 'TREASURY_EXECUTE_RELEASE'
  | 'TREASURY_FREEZE_ESCROW'

export type AXPTEvent = {
  type: AXPTEventType | string
  payload?: any
  [key: string]: any
}

type Listener = (event: AXPTEvent) => void

export class AXPTEventBus {
  private listeners: Listener[] = []

  emit(event: AXPTEvent) {
    for (const l of this.listeners) {
      l(event)
    }
  }

  // 🧠 ALIAS for older engine calls (IMPORTANT)
  emitEvent(type: AXPTEventType | string, payload: any) {
    this.emit({ type, payload } as AXPTEvent)
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((entry) => entry !== listener)
    }
  }

  unsubscribe(listener: Listener) {
    this.listeners = this.listeners.filter((entry) => entry !== listener)
  }
}

export const eventBus = new AXPTEventBus()
