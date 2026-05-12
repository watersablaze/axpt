export type ExecutionMode =
  | 'TRANSFER'
  | 'ESCROW'
  | 'REJECT'
  | 'QUARANTINE'

export type ExecutionIntent = {
  fromUserId: string
  toUserId: string
  assetCode: string
  amountBaseUnits: bigint

  riskHint?: number
  twinRiskScore?: number

  suggestedMode?: ExecutionMode

  metadata?: Record<string, any>
}