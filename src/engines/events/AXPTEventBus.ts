export type AXPTEvent =
  | { type: 'TRANSFER_EXECUTED'; payload: any }
  | { type: 'ESCROW_UPDATED'; payload: any }
  | { type: 'SETTLEMENT_FINALIZED'; payload: any }
  | { type: 'DISPUTE_RAISED'; payload: any }
  | { type: 'DISPUTE_RESOLVED'; payload: any }
  | { type: 'EXECUTION_PREVIEW'; payload: any }
  | { type: 'SYSTEM_QUARANTINE_TRIGGERED'; payload: any }
  | { type: 'RECONCILIATION_DRIFT_DETECTED'; payload: any }
  | { type: 'RECONCILIATION_TICK'; payload: any }
  | { type: 'LEDGER_HEAL_COMPLETED'; payload: any }
  | { type: 'LEDGER_REPLAY_COMPLETED'; payload: any }
  | { type: 'ESCROW_REBUILD_TRIGGERED'; payload: any }
  | { type: 'EXECUTION_FINALIZED'; payload: any }

type Listener = (event: AXPTEvent) => void

export class AXPTEventBus {
  private listeners: Listener[] = []

  emit(event: AXPTEvent) {
    for (const l of this.listeners) {
      l(event)
    }
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener)
  }
}
