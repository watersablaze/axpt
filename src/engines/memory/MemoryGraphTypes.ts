export type MemoryEventType =
  | 'TRANSFER'
  | 'ESCROW'
  | 'SETTLEMENT'
  | 'DISPUTE'
  | 'RISK'
  | 'RECONCILIATION'

export type MemoryNode = {
  id: string
  type: MemoryEventType

  entityId: string

  timestamp: number

  stateBefore?: unknown
  stateAfter?: unknown

  delta?: {
    amount?: bigint
    riskScore?: number
    trustScore?: number
  }

  causalParents?: string[]

  metadata?: Record<string, any>
}