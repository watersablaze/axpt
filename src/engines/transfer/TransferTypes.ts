export type AssetCode = 'AXG' | 'NMP' | 'USD'

export type FeeMode = 'SENDER_PAYS' | 'RECEIVER_PAYS'

export type TransferMode = 'TRANSFER' | 'ESCROW'

export type TransferExecutionMode = 'TRANSFER' | 'ESCROW'

export type TransferStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED'

export type TransferRequest = {
  fromUserId: string
  toUserId: string

  amount: string | number
  assetCode: AssetCode

  note?: string

  feeBps?: number
  feeMode?: FeeMode

  idempotencyKey?: string
  source?: string

  metadata?: {
    caseId?: string
    escrowId?: string
    [key: string]: any
  }
}

export type TransferResult = {
  transferId: string

  debitTransactionId: string
  creditTransactionId: string

  fromUserId: string
  toUserId: string

  amountBaseUnits: string
  assetCode: AssetCode

  mode: TransferMode

  status: TransferStatus
}

export type TransferExecutionContext = {

  transferId: string

  fromUserId: string

  toUserId: string

  assetCode: string

  decimals: number

  amountBaseUnits: bigint

  feeBps: number

  feeMode: 'SENDER_PAYS' | 'RECEIVER_PAYS'

  mode: TransferExecutionMode

  idempotencyKey?: string

  note?: string

  metadata?: Record<string, any>

}