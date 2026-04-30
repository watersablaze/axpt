import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'
import {
  bigintToDecimal,
  decimalToBigInt,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

type TransferInput = {
  fromUserId: string
  toUserId: string
  amount: string
  assetCode: 'AXG' | 'NMP' | 'USD'
  note?: string
  idempotencyKey?: string
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

  return await prisma.$transaction(async (tx: any) => {
    const fromWallet = await tx.wallet.findUnique({
      where: { userId: input.fromUserId },
    })

    const toWallet = await tx.wallet.findUnique({
      where: { userId: input.toUserId },
    })

    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found')
    }

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

    const senderCurrent = decimalToBigInt(fromBalance.amountBaseUnits ?? 0n)

    if (senderCurrent < amountBaseUnits) {
      throw new Error('Insufficient funds')
    }

    const receiverBalance = await tx.balance.findFirst({
      where: {
        walletId: toWallet.id,
        userId: input.toUserId,
        assetCode: asset.code,
      },
    })

    const receiverCurrent = decimalToBigInt(
      receiverBalance?.amountBaseUnits ?? 0n
    )

    const senderNext = senderCurrent - amountBaseUnits
    const receiverNext = receiverCurrent + amountBaseUnits

    // update sender
    await tx.balance.update({
      where: { id: fromBalance.id },
      data: {
        amount: Number(formatBaseUnits(senderNext, asset.decimals)),
        amountBaseUnits: bigintToDecimal(senderNext),
      },
    })

    // update receiver
    if (receiverBalance) {
      await tx.balance.update({
        where: { id: receiverBalance.id },
        data: {
          amount: Number(formatBaseUnits(receiverNext, asset.decimals)),
          amountBaseUnits: bigintToDecimal(receiverNext),
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

    const transferId = input.idempotencyKey ?? crypto.randomUUID()

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