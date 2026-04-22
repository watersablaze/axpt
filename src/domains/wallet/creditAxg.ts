// src/domains/wallet/creditAxg.ts

import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'
import {
  bigintToDecimal,
  decimalToBigInt,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'

export async function creditAxg(
  userId: string,
  amount: number | string,
  note?: string
) {
  const asset = getAsset('AXG')

  const amountBaseUnits = parseDisplayToBaseUnits(
    String(amount),
    asset.decimals
  )

  if (amountBaseUnits <= 0n) {
    throw new Error('Amount must be positive')
  }

  return await prisma.$transaction(async (tx: any) => {
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
          tokenType: asset.code as any, // legacy bridge
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

    // ✅ FIX: Transaction records DELTA, not resulting balance
    const transaction = await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: TRANSACTION_TYPES.CREDIT', 
        amount: Number(
          formatBaseUnits(amountBaseUnits, asset.decimals)
        ),
        tokenType: asset.code as any,
        assetCode: asset.code,
        amountBaseUnits: bigintToDecimal(amountBaseUnits), // ✅ FIXED
        feeBaseUnits: bigintToDecimal(0n), // explicit
        intent: 'MANUAL_CREDIT', // ✅ promote out of metadata
        metadata: {
          note: note ?? null,
        },
      },
    })

    return {
      walletId: wallet.id,
      balanceId: updatedBalance.id,
      transactionId: transaction.id,

      // display
      newAmount: formatBaseUnits(
        nextBaseUnits,
        asset.decimals
      ),

      // truth
      newAmountBaseUnits: nextBaseUnits.toString(),
    }
  })
}