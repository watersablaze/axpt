import type { EscrowStatus } from './import type { EscrowStatus } from '@/domains/escrow/escrowStatus''

export class EscrowStateMachine {
  private transitions: Record<EscrowStatus, EscrowStatus[]> = {
    INITIATED: ['FUNDS_LOCKED'],
    FUNDS_LOCKED: ['AWAITING_PARTIES'],
    AWAITING_PARTIES: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['UNDER_REVIEW', 'DISPUTED', 'SETTLEMENT_READY'],
    UNDER_REVIEW: ['ACTIVE', 'DISPUTED'],
    DISPUTED: ['ARBITRATION_PENDING'],
    ARBITRATION_PENDING: ['ARBITRATED'],
    ARBITRATED: ['SETTLEMENT_READY'],
    SETTLEMENT_READY: ['RELEASED', 'REFUNDED'],
    RELEASED: [],
    REFUNDED: [],
    CANCELLED: [],
    FAILED: [],
  }

  canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false
  }
}