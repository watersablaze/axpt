import type { EscrowStatus } from './escrowTypes'

export type EscrowTransitionEvent = {
  escrowId: string
  from: EscrowStatus
  to: EscrowStatus
  actor?: string
  metadata?: Record<string, any>
}