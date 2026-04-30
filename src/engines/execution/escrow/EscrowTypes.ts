import type { EscrowStatus } from '@/domains/escrow/escrowStatus'

export type EscrowTransitionParams = {
  escrowId: string
  next: EscrowStatus
  actor?: string
  metadata?: Record<string, any>
}
