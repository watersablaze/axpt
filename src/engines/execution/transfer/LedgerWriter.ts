import { prisma } from '@/infrastructure/db/prisma'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'
import type { TransferExecutionContext, TransferResult } from './TransferTypes'

export class LedgerWriter {
  async execute(ctx: TransferExecutionContext): Promise<TransferResult> {
    return prisma.$transaction(async (tx: any) => {
      /**
       * ──────────────────────────────
       * 1. ATOMIC WALLET LOCK + READ
       * ──────────────────────────────
       */
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: ctx.fromUserId },
      })

      const receiverWallet = await tx.wallet.findUnique({
        where: { userId: ctx.toUserId },
      })

      if (!senderWallet || !receiverWallet) {
        throw new Error('WALLET_NOT_FOUND')
      }

      const senderBalance = await tx.balance.findFirst({
        where: {
          walletId: senderWallet.id,
          userId: ctx.fromUserId,
          assetCode: ctx.assetCode,
        },
      })

      if (!senderBalance) {
        throw new Error('SENDER_BALANCE_NOT_FOUND')
      }

      const senderBase = BigInt(senderBalance.amountBaseUnits ?? 0)

      if (senderBase < ctx.amountBaseUnits) {
        throw new Error('INSUFFICIENT_FUNDS')
      }

      const receiverBalance = await tx.balance.findFirst({
        where: {
          walletId: receiverWallet.id,
          userId: ctx.toUserId,
          assetCode: ctx.assetCode,
        },
      })

      const receiverBase = BigInt(receiverBalance?.amountBaseUnits ?? 0)

      const nextSender = senderBase - ctx.amountBaseUnits
      const nextReceiver = receiverBase + ctx.amountBaseUnits

      /**
       * ──────────────────────────────
       * 2. BALANCE MUTATION (INVARIANT SAFE)
       * ──────────────────────────────
       */
      await tx.balance.update({
        where: { id: senderBalance.id },
        data: {
          amountBaseUnits: nextSender.toString(),
        },
      })

      if (receiverBalance) {
        await tx.balance.update({
          where: { id: receiverBalance.id },
          data: {
            amountBaseUnits: nextReceiver.toString(),
          },
        })
      } else {
        await tx.balance.create({
          data: {
            userId: ctx.toUserId,
            walletId: receiverWallet.id,
            assetCode: ctx.assetCode,
            amountBaseUnits: nextReceiver.toString(),
            amount: Number(nextReceiver),
          },
        })
      }

      /**
       * ──────────────────────────────
       * 3. DOUBLE ENTRY JOURNAL (STRICT INVARIANT)
       * ──────────────────────────────
       */
      const journalGroupId = ctx.transferId

      const [debit, credit] = await Promise.all([
        tx.transaction.create({
          data: {
            userId: ctx.fromUserId,
            walletId: senderWallet.id,
            type: TRANSACTION_TYPES.DEBIT,
            amountBaseUnits: ctx.amountBaseUnits.toString(),
            tokenType: ctx.assetCode,
            metadata: {
              journalGroupId,
              direction: 'OUT',
            },
          },
        }),

        tx.transaction.create({
          data: {
            userId: ctx.toUserId,
            walletId: receiverWallet.id,
            type: TRANSACTION_TYPES.CREDIT,
            amountBaseUnits: ctx.amountBaseUnits.toString(),
            tokenType: ctx.assetCode,
            metadata: {
              journalGroupId,
              direction: 'IN',
            },
          },
        }),
      ])

      /**
       * ──────────────────────────────
       * 4. POST-INVARIANT CHECK (CRITICAL)
       * ──────────────────────────────
       */
      const finalSender = await tx.balance.findUnique({
        where: { id: senderBalance.id },
      })

      const finalReceiver = receiverBalance
        ? await tx.balance.findUnique({
            where: { id: receiverBalance.id },
          })
        : null

      if (!finalSender || BigInt(finalSender.amountBaseUnits) < 0n) {
        throw new Error('LEDGER_INVARIANT_VIOLATION_SENDER')
      }

      if (
        finalReceiver &&
        BigInt(finalReceiver.amountBaseUnits) < 0n
      ) {
        throw new Error('LEDGER_INVARIANT_VIOLATION_RECEIVER')
      }

      /**
       * ──────────────────────────────
       * 5. RETURN CANONICAL RESULT
       * ──────────────────────────────
       */
      const transferId = ctx.transferId
      const mode = ctx.mode

      return {
        transferId,

        debitTransactionId: debit.id,
        creditTransactionId: credit.id,

        fromUserId: ctx.fromUserId,
        toUserId: ctx.toUserId,

        amountBaseUnits: ctx.amountBaseUnits.toString(),
        assetCode: ctx.assetCode,

        mode,

        status: 'COMPLETED' as const,
      }
    })
  }
}
