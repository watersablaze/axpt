export function assertValidTransition(
  from: string,
  to: string
) {
  const allowed: Record<string, string[]> = {
    INITIATED: ['LOCKED'],
    LOCKED: ['HELD_IN_TRUST', 'DISPUTED', 'CANCELLED'],
    HELD_IN_TRUST: ['AWAITING_APPROVAL', 'DISPUTED'],
    DISPUTED: ['RESOLVED_RELEASE', 'RESOLVED_REFUND'],
    RESOLVED_RELEASE: ['SETTLED'],
    RESOLVED_REFUND: ['SETTLED'],
    SETTLED: [],
    CANCELLED: [],
    EXPIRED: ['RESOLVED_REFUND', 'CANCELLED'],
  }

  if (!allowed[from]?.includes(to)) {
    throw new Error(
      `INVALID_ESCROW_TRANSITION: ${from} → ${to}`
    )
  }
}