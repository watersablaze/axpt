// src/engines/settlement/SettlementTypes.ts
export type SettlementDecision =
  | 'RELEASE'
  | 'REFUND'
  | 'SPLIT'
  | 'VOID'

export type SettlementRequest = {
  escrowId: string
  decision: SettlementDecision
  actor?: string
  reason?: string
}