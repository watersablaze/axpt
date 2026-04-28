import type { Prisma } from '@prisma/client'
import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'
import {
  bigintToDecimal,
  decimalToBigInt,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

type Tx = Prisma.TransactionClient

export async function creditAxg(
  userId: string,
  amount: number,
  note?: string
) {
  const asset = getAsset('AXG')

  const amountBaseUnits = parseDisplayToBaseUnits(
    amount.toString(),
    asset.decimals
  )

  if (amountBaseUnits <= 0n) {
    throw new Error('Amount must be positive')
  }

  return await prisma.$transaction(async (tx: Tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new Error('Wallet not found for user')
    }

    let balance = await tx.balance.findFirst({
      where: {
        walletId: wallet.id,
        userId,
        assetCode: asset.code,
      },
    })

    if (!balance) {
      balance = await tx.balance.create({
        data: {
          userId,
          walletId: wallet.id,
          tokenType: asset.code as any,
          assetCode: asset.code,
          amount: 0,
          amountBaseUnits: bigintToDecimal(0n),
        },
      })
    }

    const currentBaseUnits = decimalToBigInt(
      balance.amountBaseUnits ?? 0
    )

    const nextBaseUnits = currentBaseUnits + amountBaseUnits

    const updatedBalance = await tx.balance.update({
      where: { id: balance.id },
      data: {
        amount: Number(
          formatBaseUnits(nextBaseUnits, asset.decimals)
        ),
        amountBaseUnits: bigintToDecimal(nextBaseUnits),
        assetCode: asset.code,
      },
    })

    const transaction = await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: TRANSACTION_TYPES.CREDIT,
        amount: Number(
          formatBaseUnits(amountBaseUnits, asset.decimals)
        ),
        tokenType: asset.code as any,
        assetCode: asset.code,
        amountBaseUnits: bigintToDecimal(amountBaseUnits),
        feeBaseUnits: bigintToDecimal(0n),
        intent: 'MANUAL_CREDIT',
        metadata: {
          note: note ?? null,
        },
      },
    })

    return {
      walletId: wallet.id,
      balanceId: updatedBalance.id,
      transactionId: transaction.id,

      newAmount: formatBaseUnits(
        nextBaseUnits,
        asset.decimals
      ),

      newAmountBaseUnits: nextBaseUnits.toString(),
    }
  })
}