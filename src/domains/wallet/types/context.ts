// src/domains/wallet/types/context.ts

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

  intent: 'PEER' | 'TREASURY' | 'INVESTMENT' | 'REWARD'
}