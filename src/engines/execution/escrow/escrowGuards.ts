export function assertValidTransition(
  from: string,
  to: string
) {
  const allowed: Record<string, string[]> = {
    INITIATED: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['FUNDS_LOCKED', 'DISPUTED', 'CANCELLED'],
    FUNDS_LOCKED: ['DISPUTED', 'RELEASED', 'CANCELLED'],
    DISPUTED: ['ARBITRATED', 'CANCELLED'],
    ARBITRATED: ['RELEASED', 'CANCELLED'],
    RELEASED: ['SETTLED'],
    CANCELLED: [],
    SETTLED: [],
  }

  if (!allowed[from]?.includes(to)) {
    throw new Error(
      `INVALID_ESCROW_TRANSITION: ${from} → ${to}`
    )
  }
}
