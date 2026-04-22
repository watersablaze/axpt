export type EscrowStatus =
  | "PENDING"
  | "LOCKED"
  | "RELEASED"
  | "CANCELLED"

export type EscrowRecord = {
  caseId: string
  amount: number
  currency: string
  status: EscrowStatus
}