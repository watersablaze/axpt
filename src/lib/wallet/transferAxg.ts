import { prisma } from '@/lib/prisma';
import { createResidentWallet } from '@/lib/wallet/createResidentWallet';

type TransferParams = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
};

/**
 * Resident -> Resident AXG transfer on custodial ledger.
 * - Ensures both wallets/balances exist (auto-births recipient if needed)
 * - Checks sufficient funds
 * - Atomically debits sender and credits recipient
 * - Writes two Transaction rows (debit + credit) with counterparty metadata
 */
export async function transferAxg({ fromUserId, toUserId, amount, note }: TransferParams) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number.');
  }
  if (fromUserId === toUserId) {
    throw new Error('Cannot transfer to self.');
  }

  // Ensure recipient has a wallet/balances (sender is expected to have one already)
  await createResidentWallet(toUserId);

  return await prisma.$transaction(async (tx) => {
    // Fetch wallets
    const [fromWallet, toWallet] = await Promise.all([
      tx.wallet.findUnique({
        where: { userId: fromUserId },
        include: { balances: true },
      }),
      tx.wallet.findUnique({
        where: { userId: toUserId },
        include: { balances: true },
      }),
    ]);

    if (!fromWallet) throw new Error('Sender wallet not found.');
    if (!toWallet) throw new Error('Recipient wallet not found.');

    // Ensure AXG balances exist
    let fromAxg = fromWallet.balances.find((b) => b.tokenType === 'AXG');
    if (!fromAxg) {
      fromAxg = await tx.balance.create({
        data: { userId: fromUserId, walletId: fromWallet.id, tokenType: 'AXG', amount: 0 },
      });
    }
    let toAxg = toWallet.balances.find((b) => b.tokenType === 'AXG');
    if (!toAxg) {
      toAxg = await tx.balance.create({
        data: { userId: toUserId, walletId: toWallet.id, tokenType: 'AXG', amount: 0 },
      });
    }

    // Check funds
    if (fromAxg.amount < amount) {
      throw new Error('Insufficient AXG balance.');
    }

    // Apply balances
    const [fromUpdated, toUpdated] = await Promise.all([
      tx.balance.update({
        where: { id: fromAxg.id },
        data: { amount: fromAxg.amount - amount },
      }),
      tx.balance.update({
        where: { id: toAxg.id },
        data: { amount: toAxg.amount + amount },
      }),
    ]);

    // Write transactions (debit for sender, credit for receiver)
    const [debitTx, creditTx] = await Promise.all([
      tx.transaction.create({
        data: {
          userId: fromUserId,
          walletId: fromWallet.id,
          type: 'debit',
          amount,
          tokenType: 'AXG',
          metadata: { toUserId, note },
        },
      }),
      tx.transaction.create({
        data: {
          userId: toUserId,
          walletId: toWallet.id,
          type: 'credit',
          amount,
          tokenType: 'AXG',
          metadata: { fromUserId, note },
        },
      }),
    ]);

    return {
      ok: true as const,
      from: { walletId: fromWallet.id, balanceId: fromUpdated.id, newAmount: fromUpdated.amount, txId: debitTx.id },
      to: { walletId: toWallet.id, balanceId: toUpdated.id, newAmount: toUpdated.amount, txId: creditTx.id },
    };
  });
}