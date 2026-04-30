import { ESCROW_STATUS, EscrowStatus } from "./escrowStatus"

const transitions: Record<EscrowStatus, EscrowStatus[]> = {
  INITIATED: ["ACTIVE", "CANCELLED"],

  ACTIVE: ["FUNDS_LOCKED", "DISPUTED", "CANCELLED"],

  FUNDS_LOCKED: ["DISPUTED", "RELEASED", "CANCELLED"],

  DISPUTED: ["ARBITRATED", "CANCELLED"],

  ARBITRATED: ["RELEASED", "CANCELLED"],

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
