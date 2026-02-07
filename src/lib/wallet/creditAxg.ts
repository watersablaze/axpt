// src/lib/wallet/creditAxg.ts
import { prisma } from '@/lib/prisma';

const AXG = 'AXG';

export async function creditAxg(userId: string, amount: number, note?: string) {
  if (amount <= 0) throw new Error('Amount must be positive');

  return await prisma.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found for user');

    let axg = await tx.balance.findFirst({
      where: { walletId: wallet.id, userId, tokenType: AXG },
    });

    if (!axg) {
      axg = await tx.balance.create({
        data: { userId, walletId: wallet.id, tokenType: AXG, amount: 0 },
      });
    }

    const updated = await tx.balance.update({
      where: { id: axg.id },
      data: { amount: { increment: amount } }, // atomic
    });

    const txRow = await tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'credit',
        amount,
        tokenType: AXG,
        metadata: note ? { note } : undefined,
      },
    });

    return {
      walletId: wallet.id,
      balanceId: updated.id,
      transactionId: txRow.id,
      newAmount: updated.amount,
    };
  });
}
