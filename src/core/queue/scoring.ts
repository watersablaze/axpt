export function getRiskScore(c: any): number {
  if (c.status === "ESCROW_MISMATCH") return 10
  if (c.status === "AT_RISK") return 9
  if (c.escrowStatus === "PENDING") return 6
  return 3
}

export function getUrgencyScore(c: any): number {
  if (c.status === "ESCROW_PENDING") return 9
  if (c.status === "IN_REVIEW") return 7
  return 4
}

export function getValueScore(c: any): number {
  const amount = Number(c.expectedAmount ?? 0)

  if (amount > 100000) return 10
  if (amount > 10000) return 7
  return 4
}