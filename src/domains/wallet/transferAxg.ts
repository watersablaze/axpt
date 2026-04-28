import { prisma } from '@/infrastructure/db/prisma'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'
import { getAsset } from '@/lib/assets/registry'
import {
  decimalToBigInt,
  bigintToDecimal,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'

type TransferInput = {
  fromUserId: string
  toUserId: string
  amount: string
  assetCode: 'AXG' | 'NMP' | 'USD'
  note?: string
}

export async function transferAxg(input: TransferInput) {
  const asset = getAsset(input.assetCode)

  const amountBaseUnits = parseDisplayToBaseUnits(
    input.amount,
    asset.decimals
  )

  if (amountBaseUnits <= 0n) {
    throw new Error('Transfer amount must be positive')
  }

  return await prisma.$transaction(async (tx) => {
    // 1. wallets
    const fromWallet = await tx.wallet.findUnique({
      where: { userId: input.fromUserId },
    })

    const toWallet = await tx.wallet.findUnique({
      where: { userId: input.toUserId },
    })

    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found')
    }

    // 2. balance (sender)
    const fromBalance = await tx.balance.findFirst({
      where: {
        walletId: fromWallet.id,
        userId: input.fromUserId,
        assetCode: asset.code,
      },
    })

    if (!fromBalance) {
      throw new Error('Sender balance not found')
    }

    const current = decimalToBigInt(fromBalance.amountBaseUnits ?? 0n)

    if (current < amountBaseUnits) {
      throw new Error('Insufficient funds')
    }

    const nextSender = current - amountBaseUnits

    // 3. receiver balance
    const toBalance = await tx.balance.findFirst({
      where: {
        walletId: toWallet.id,
        userId: input.toUserId,
        assetCode: asset.code,
      },
    })

    const toCurrent = decimalToBigInt(toBalance?.amountBaseUnits ?? 0n)
    const nextReceiver = toCurrent + amountBaseUnits

    // 4. update sender
    await tx.balance.update({
      where: { id: fromBalance.id },
      data: {
        amount: Number(formatBaseUnits(nextSender, asset.decimals)),
        amountBaseUnits: bigintToDecimal(nextSender),
      },
    })

    // 5. update receiver (create if missing)
    if (toBalance) {
      await tx.balance.update({
        where: { id: toBalance.id },
        data: {
          amount: Number(formatBaseUnits(nextReceiver, asset.decimals)),
          amountBaseUnits: bigintToDecimal(nextReceiver),
        },
      })
    } else {
      await tx.balance.create({
        data: {
          userId: input.toUserId,
          walletId: toWallet.id,
          assetCode: asset.code,
          tokenType: asset.code,
          amount: Number(formatBaseUnits(amountBaseUnits, asset.decimals)),
          amountBaseUnits: bigintToDecimal(amountBaseUnits),
        },
      })
    }

    // 6. ledger entries (dual write)
    const transferId = crypto.randomUUID()

    const debit = await tx.transaction.create({
      data: {
        userId: input.fromUserId,
        walletId: fromWallet.id,
        type: TRANSACTION_TYPES.DEBIT,
        amount: Number(formatBaseUnits(amountBaseUnits, asset.decimals)),
        assetCode: asset.code,
        amountBaseUnits: bigintToDecimal(amountBaseUnits),
        metadata: {
          transferId,
          direction: 'OUT',
          toUserId: input.toUserId,
          note: input.note ?? null,
        },
      },
    })

    const credit = await tx.transaction.create({
      data: {
        userId: input.toUserId,
        walletId: toWallet.id,
        type: TRANSACTION_TYPES.CREDIT,
        amount: Number(formatBaseUnits(amountBaseUnits, asset.decimals)),
        assetCode: asset.code,
        amountBaseUnits: bigintToDecimal(amountBaseUnits),
        metadata: {
          transferId,
          direction: 'IN',
          fromUserId: input.fromUserId,
          note: input.note ?? null,
        },
      },
    })

    return {
      transferId,
      debitId: debit.id,
      creditId: credit.id,
    }
  })
}