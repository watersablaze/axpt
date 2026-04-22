import type { TransferIntent } from '@/domains/wallet/types/transferContext'

export type TreasuryPolicyInput = {
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

export type TreasuryPolicyDecision =
  | { action: 'ALLOW' }
  | {
      action: 'REQUIRE_APPROVAL'
      code: 'TREASURY_APPROVAL_REQUIRED'
      reason: string
      approvalType: 'SINGLE' | 'DUAL' | 'COUNCIL'
    }
  | { action: 'DENY'; code: string; reason: string }
