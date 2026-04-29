type AXPTEvent =
  | { type: 'TRANSFER_EXECUTED'; payload: any }
  | { type: 'ESCROW_CREATED'; payload: any }
  | { type: 'ESCROW_UPDATED'; payload: any }
  | { type: 'DISPUTE_RAISED'; payload: any }
  | { type: 'SETTLEMENT_FINALIZED'; payload: any }
  | { type: 'LEDGER_WRITTEN'; payload: any }

type Listener = (event: AXPTEvent) => void

export class AXPTEventBus {
  private listeners: Listener[] = []

  subscribe(fn: Listener) {
    this.listeners.push(fn)
  }

  emit(event: AXPTEvent) {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}