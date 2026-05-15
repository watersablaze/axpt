export type AssetCode = 'AXG' | 'NMP' | 'USD'

export type FeeMode = 'SENDER_PAYS' | 'RECEIVER_PAYS'

export type TransferMode = 'TRANSFER' | 'ESCROW'

export type TransferStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED'

/**
 * RAW INPUT LAYER (EXTERNAL SYSTEM)
 */
export type TransferRequest = {
  fromUserId: string
  toUserId: string

  amount: string | number
  assetCode: AssetCode

  feeBps?: number
  feeMode?: FeeMode

  idempotencyKey?: string
  source?: string

  note?: string

  metadata?: {
    caseId?: string
    escrowId?: string
    [key: string]: any
  }
}

/**
 * CANONICAL EXECUTION CONTEXT (INTERNAL LEDGER LANGUAGE)
 */
export type TransferExecutionContext = {
  transferId: string

  fromUserId: string
  toUserId: string

  assetCode: AssetCode
  decimals: number

  amountBaseUnits: bigint

  feeBps: number
  feeMode: FeeMode

  mode: TransferMode

  idempotencyKey?: string

  note?: string

  metadata?: Record<string, any>
}

/**
 * FINAL OUTPUT LAYER
 */
export type TransferResult = {
  transferId: string
  escrowId?: string | null

  debitTransactionId: string
  creditTransactionId: string

  fromUserId: string
  toUserId: string

  amountBaseUnits: string
  assetCode: AssetCode

  mode: TransferMode
  status: TransferStatus
}
