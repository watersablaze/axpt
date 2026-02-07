import { prisma } from '@/lib/prisma';
import { executeTransaction } from './execute';
import type { TransferRequest, TransferResult } from './types.service';
import { assertWalletPolicy, type WalletRole } from './policy';
import {
  InsufficientFundsError,
  NotFoundError,
  WalletError,
} from './errors';

/**
 * Lock a Balance row for update (Postgres).
 * Must be called inside a transaction.
 */
async function lockBalanceRow(tx: any, balanceId: string) {
  await tx.$queryRawUnsafe(
    `SELECT id FROM "Balance" WHERE id = $1 FOR UPDATE`,
    balanceId
  );
}

function computeFee(amount: number, feeBps?: number) {
  const bps = feeBps ?? 0;
  if (bps <= 0) return 0;
  return (amount * bps) / 10_000;
}

export async function transferToken(
  req: TransferRequest
): Promise<TransferResult> {
  const {
    fromUserId,
    toUserId,
    amount,
    tokenType,
    note,
    idempotencyKey,
    source = 'api',
    feeBps = 0,
    feeMode = 'SENDER_PAYS',
  } = req;

  /* ───────────────────────────────
     Validation
  ─────────────────────────────── */

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletError('BAD_REQUEST', 'amount (positive number) is required', 400);
  }

  if (!idempotencyKey) {
    throw new WalletError('BAD_REQUEST', 'Missing idempotencyKey', 400);
  }

  if (fromUserId === toUserId) {
    throw new WalletError('BAD_REQUEST', 'Cannot transfer to self', 400);
  }

  /* ───────────────────────────────
     Idempotency replay (journal-first)
  ─────────────────────────────── */

  const existing = await prisma.walletEvent.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return {
      transactionId: (existing.payload as any)?.transactionId ?? '',
      debitEventId: existing.id,
      creditEventId: (existing.payload as any)?.creditEventId ?? '',
      feeEventId: (existing.payload as any)?.feeEventId ?? null,
      fromNext: existing.nextAmount ?? 0,
      toNext: (existing.payload as any)?.toNext ?? 0,
      feeAmount: (existing.payload as any)?.feeAmount ?? 0,
      idempotentReplay: true,
      requestId: (existing.payload as any)?.requestId ?? 'replay',
    };
  }

  const requestId = req.requestId ?? crypto.randomUUID();
  const feeAmount = computeFee(amount, feeBps);

  /* ───────────────────────────────
     Policy-as-code
  ─────────────────────────────── */

  const role: WalletRole = (req as any).role ?? 'USER';

  assertWalletPolicy({
    fromUserId,
    toUserId,
    tokenType,
    amount,
    role,
  });

  /* ───────────────────────────────
     Fee distribution
  ─────────────────────────────── */

  const senderDebitAmount =
    feeMode === 'SENDER_PAYS'
      ? amount + feeAmount
      : feeMode === 'SPLIT'
      ? amount + feeAmount / 2
      : amount;

  const recipientCreditAmount =
    feeMode === 'RECIPIENT_PAYS'
      ? amount - feeAmount
      : feeMode === 'SPLIT'
      ? amount - feeAmount / 2
      : amount;

  if (recipientCreditAmount <= 0) {
    throw new WalletError('BAD_REQUEST', 'Fee too large for amount', 400);
  }

  /* ───────────────────────────────
     Atomic transaction
  ─────────────────────────────── */

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Wallets
      const fromWallet = await tx.wallet.findFirst({
        where: { userId: fromUserId },
        select: { id: true },
      });

      const toWallet = await tx.wallet.findFirst({
        where: { userId: toUserId },
        select: { id: true },
      });

      if (!fromWallet || !toWallet) {
        throw new NotFoundError('Wallet not found for sender or recipient');
      }

      // Balances
      const fromBalance = await tx.balance.findFirst({
        where: { walletId: fromWallet.id, tokenType },
      });

      const toBalance = await tx.balance.findFirst({
        where: { walletId: toWallet.id, tokenType },
      });

      if (!fromBalance || !toBalance) {
        throw new NotFoundError('Balance row missing for token');
      }

      // Locks
      await lockBalanceRow(tx, fromBalance.id);
      await lockBalanceRow(tx, toBalance.id);

      const fromLocked = await tx.balance.findUnique({ where: { id: fromBalance.id } });
      const toLocked = await tx.balance.findUnique({ where: { id: toBalance.id } });

      if (!fromLocked || !toLocked) {
        throw new NotFoundError('Locked balances not found');
      }

      // Engine math
      let fromNext;
      try {
        fromNext = executeTransaction(
          { currency: tokenType, amount: fromLocked.amount },
          { currency: tokenType, amount: senderDebitAmount, direction: 'DEBIT' }
        );
      } catch {
        throw new InsufficientFundsError();
      }

      const toNext = executeTransaction(
        { currency: tokenType, amount: toLocked.amount },
        { currency: tokenType, amount: recipientCreditAmount, direction: 'CREDIT' }
      );

      // DEBIT
      const debitEvent = await tx.walletEvent.create({
        data: {
          walletId: fromWallet.id,
          userId: fromUserId,
          type: 'DEBIT',
          tokenType,
          amount: senderDebitAmount,
          prevAmount: fromLocked.amount,
          nextAmount: fromNext.amount,
          idempotencyKey,
          requestId,
          source,
          payload: {
            toUserId,
            note: note ?? null,
            baseAmount: amount,
            feeAmount,
            feeMode,
          },
        },
      });

      // CREDIT
      const creditEvent = await tx.walletEvent.create({
        data: {
          walletId: toWallet.id,
          userId: toUserId,
          type: 'CREDIT',
          tokenType,
          amount: recipientCreditAmount,
          prevAmount: toLocked.amount,
          nextAmount: toNext.amount,
          source,
          payload: {
            fromUserId,
            note: note ?? null,
            baseAmount: amount,
            feeAmount,
            feeMode,
            debitEventId: debitEvent.id,
          },
        },
      });

      /* ───────── Fee handling (treasury-aware) ───────── */

      let feeEventId: string | null = null;
      const treasuryWalletId = process.env.TREASURY_WALLET_ID?.trim() || null;

      if (feeAmount > 0) {
        if (treasuryWalletId) {
          const treasuryBalance = await tx.balance.findFirst({
            where: { walletId: treasuryWalletId, tokenType },
          });

          if (!treasuryBalance) {
            throw new NotFoundError('Treasury balance row missing for token');
          }

          await lockBalanceRow(tx, treasuryBalance.id);

          const treasuryLocked = await tx.balance.findUnique({
            where: { id: treasuryBalance.id },
          });

          if (!treasuryLocked) {
            throw new NotFoundError('Locked treasury balance not found');
          }

          const treasuryNext = executeTransaction(
            { currency: tokenType, amount: treasuryLocked.amount },
            { currency: tokenType, amount: feeAmount, direction: 'CREDIT' }
          );

          const feeEvent = await tx.walletEvent.create({
            data: {
              walletId: treasuryWalletId,
              type: 'FEE',
              tokenType,
              amount: feeAmount,
              prevAmount: treasuryLocked.amount,
              nextAmount: treasuryNext.amount,
              source,
              payload: {
                requestId,
                baseAmount: amount,
                feeAmount,
                feeMode,
                fromUserId,
                toUserId,
                debitEventId: debitEvent.id,
                creditEventId: creditEvent.id,
              },
            },
          });

          await tx.balance.update({
            where: { id: treasuryLocked.id },
            data: { amount: treasuryNext.amount },
          });

          feeEventId = feeEvent.id;
        } else {
          const feeEvent = await tx.walletEvent.create({
            data: {
              walletId: fromWallet.id,
              userId: fromUserId,
              type: 'FEE',
              tokenType,
              amount: feeAmount,
              prevAmount: fromNext.amount,
              nextAmount: fromNext.amount,
              source,
              payload: {
                requestId,
                baseAmount: amount,
                feeAmount,
                feeMode,
                debitEventId: debitEvent.id,
                creditEventId: creditEvent.id,
              },
            },
          });

          feeEventId = feeEvent.id;
        }
      }

      // Snapshots
      await tx.balance.update({
        where: { id: fromLocked.id },
        data: { amount: fromNext.amount },
      });

      await tx.balance.update({
        where: { id: toLocked.id },
        data: { amount: toNext.amount },
      });

      // Transaction record
      const trx = await tx.transaction.create({
        data: {
          userId: fromUserId,
          walletId: fromWallet.id,
          type: 'TRANSFER',
          amount,
          tokenType,
          metadata: {
            requestId,
            idempotencyKey,
            note: note ?? null,
            baseAmount: amount,
            feeAmount,
            feeMode,
            debitEventId: debitEvent.id,
            creditEventId: creditEvent.id,
            feeEventId,
          },
        },
      });

      // Patch debit payload for replay
      await tx.walletEvent.update({
        where: { id: debitEvent.id },
        data: {
          payload: {
            toUserId,
            note: note ?? null,
            baseAmount: amount,
            feeAmount,
            feeMode,
            requestId,
            transactionId: trx.id,
            creditEventId: creditEvent.id,
            feeEventId,
            toNext: toNext.amount,
          },
        },
      });

      // Outbox (ChainMirror)
      await tx.chainMirrorJob.create({
        data: {
          transactionId: trx.id,
          walletEventId: debitEvent.id,
          walletId: fromWallet.id,
          tokenType,
          amount,
          direction: 'TRANSFER',
          network: 'ethereum',
          idempotencyKey: `mirror-${idempotencyKey}`,
          requestId,
          status: 'PENDING',
        },
      });

      return {
        transactionId: trx.id,
        debitEventId: debitEvent.id,
        creditEventId: creditEvent.id,
        feeEventId,
        fromNext: fromNext.amount,
        toNext: toNext.amount,
        feeAmount,
        requestId,
      };
    });

    return { ...result, idempotentReplay: false };
  } catch (err: any) {
    const raced = await prisma.walletEvent.findUnique({
      where: { idempotencyKey },
    });

    if (raced) {
      return {
        transactionId: (raced.payload as any)?.transactionId ?? '',
        debitEventId: raced.id,
        creditEventId: (raced.payload as any)?.creditEventId ?? '',
        feeEventId: (raced.payload as any)?.feeEventId ?? null,
        fromNext: raced.nextAmount ?? 0,
        toNext: (raced.payload as any)?.toNext ?? 0,
        feeAmount: (raced.payload as any)?.feeAmount ?? 0,
        idempotentReplay: true,
        requestId: (raced.payload as any)?.requestId ?? 'replay',
      };
    }

    if (err?.code && err?.status) throw err;

    throw new WalletError('TRANSFER_FAILED', err?.message ?? 'transfer failed', 400);
  }
}
