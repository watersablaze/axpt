import type { EscrowStatus } from '@/domains/escrow/escrowStatus'

export class EscrowStateMachine {
  private transitions: Record<EscrowStatus, EscrowStatus[]> = {
    INITIATED: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['FUNDS_LOCKED', 'DISPUTED', 'CANCELLED'],
    FUNDS_LOCKED: ['DISPUTED', 'RELEASED', 'CANCELLED'],
    DISPUTED: ['ARBITRATED', 'CANCELLED'],
    ARBITRATED: ['RELEASED', 'CANCELLED'],
    RELEASED: ['SETTLED'],
    SETTLED: [],
    CANCELLED: [],
  }

  canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false
  }
}
