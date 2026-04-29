import { ESCROW_STATUS, EscrowStatus } from "./escrowStatus"

const transitions: Record<EscrowStatus, EscrowStatus[]> = {
  INITIATED: ["FUNDS_LOCKED", "CANCELLED"],

  FUNDS_LOCKED: ["AWAITING_CONDITION", "CANCELLED"],

  AWAITING_CONDITION: ["DISPUTED", "RELEASE_APPROVED", "CANCELLED"],

  DISPUTED: ["RELEASE_APPROVED", "CANCELLED"],

  RELEASE_APPROVED: ["RELEASED"],

  RELEASED: ["SETTLED"],

  CANCELLED: [],

  SETTLED: [],
}

export function canTransition(
  from: EscrowStatus,
  to: EscrowStatus
): boolean {
  return transitions[from]?.includes(to) ?? false
}