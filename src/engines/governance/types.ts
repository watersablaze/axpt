export type ExecutionDecision =
  | 'TRANSFER'
  | 'ESCROW'
  | 'REJECT'
  | 'QUARANTINE'

export type GovernorResult = {
  decision: ExecutionDecision
  riskScore: number
  twinScore: number
  reason?: string
}