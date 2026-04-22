export type TransferIntent =
  | 'PEER'
  | 'TREASURY'
  | 'INVESTMENT'
  | 'REWARD'

export type TransferContext = {
  principal: {
    userId: string
    roles: string[]
    permissions: string[]
  }
  senderUserId: string
  recipientUserId: string
  assetCode: string
  amountBaseUnits: bigint
  intent: TransferIntent
}