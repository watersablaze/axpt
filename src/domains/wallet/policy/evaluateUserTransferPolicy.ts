import { prisma } from '@/infrastructure/db/prisma'
import type { TransferContext } from '@/domains/wallet/types/transferContext'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

const MAX_RESIDENT_TRANSFER = 100_000000n // 100 AXG
const MAX_DAILY_LIMIT = 500_000000n // 500 AXG

export type PolicyDecision =
  | { action: 'ALLOW' }
  | {
      action: 'REQUIRE_APPROVAL'
      code: 'TREASURY_APPROVAL_REQUIRED'
      reason: string
      approvalType: 'SINGLE' | 'DUAL' | 'COUNCIL'
    }
  | {
      action: 'DENY'
      code: string
      reason: string
    }

async function isSameTierOrApproved(
  senderUserId: string,
  recipientUserId: string
) {
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderUserId },
      select: { tier: true },
    }),
    prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { tier: true },
    }),
  ])

  if (!sender || !recipient) return false

  return (
    typeof sender.tier === 'string' &&
    typeof recipient.tier === 'string' &&
    sender.tier === recipient.tier
  )
}

export async function evaluateUserTransferPolicy(
  input: TransferContext
): Promise<PolicyDecision> {
  const {
    principal,
    senderUserId,
    recipientUserId,
    assetCode,
    amountBaseUnits,
  } = input

  if (!principal.permissions.includes('WALLET_TRANSFER')) {
    return {
      action: 'DENY',
      code: 'FORBIDDEN',
      reason: 'Missing WALLET_TRANSFER permission',
    }
  }

  if (
    principal.userId !== senderUserId &&
    !principal.roles.includes('ADMIN_PLATFORM')
  ) {
    return {
      action: 'DENY',
      code: 'FORBIDDEN_ACTOR_SCOPE',
      reason: 'Cannot transfer on behalf of another user',
    }
  }

  if (amountBaseUnits <= 0n) {
    return {
      action: 'DENY',
      code: 'INVALID_AMOUNT',
      reason: 'Amount must be positive',
    }
  }

  const dailyVolume = await prisma.transaction.aggregate({
    _sum: { amountBaseUnits: true },
    where: {
      userId: principal.userId,
      type: TRANSACTION_TYPES.DEBIT,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  })

  const summed =
    dailyVolume._sum.amountBaseUnits

  const dailyMovedBaseUnits =
    BigInt(String(summed ?? 0)) + amountBaseUnits

  if (dailyMovedBaseUnits > MAX_DAILY_LIMIT) {
    return {
      action: 'DENY',
      code: 'DAILY_LIMIT_EXCEEDED',
      reason: 'Daily transfer limit reached',
    }
  }

  if (principal.roles.includes('RESIDENT')) {
    if (assetCode !== 'AXG') {
      return {
        action: 'DENY',
        code: 'ASSET_FORBIDDEN',
        reason: 'Residents may only transfer AXG',
      }
    }

    if (amountBaseUnits > MAX_RESIDENT_TRANSFER) {
      return {
        action: 'DENY',
        code: 'LIMIT_EXCEEDED',
        reason: 'Transfer exceeds resident limit',
      }
    }

    if (senderUserId === recipientUserId) {
      return {
        action: 'DENY',
        code: 'SELF_TRANSFER_FORBIDDEN',
        reason: 'Cannot transfer to self',
      }
    }

    const allowedRecipient = await isSameTierOrApproved(
      senderUserId,
      recipientUserId
    )

    if (!allowedRecipient) {
      return {
        action: 'DENY',
        code: 'FORBIDDEN_ACTOR_SCOPE',
        reason: 'Resident cannot transfer to this user',
      }
    }
  }

  return { action: 'ALLOW' }
}