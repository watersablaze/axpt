// src/lib/wallet/createResidentWallet.ts
import { prisma } from '@/lib/prisma';

export async function createResidentWallet(userId: string) {
  // 1) Ensure wallet exists (1:1 with user)
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      balances: { include: { token: true } },
      blockchainWallet: true,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId }, // ✅ no 'address' here — matches your schema
      include: {
        balances: { include: { token: true } },
        blockchainWallet: true,
      },
    });
  }

  // 2) Ensure AXG/NMP balances exist (enum path)
  const want = ['AXG', 'NMP'] as const;
  const have = new Set(
    wallet.balances
      .map(b => (b.token ? b.token.symbol : b.tokenType))
      .filter(Boolean) as string[]
  );

  for (const sym of want) {
    if (!have.has(sym)) {
      await prisma.balance.create({
        data: {
          userId,
          walletId: wallet.id,
          tokenType: sym as any, // TokenType enum
          amount: 0,
        },
      });
    }
  }

  // 3) Ensure a BlockchainWallet stub exists (no on-chain address yet)
  if (!wallet.blockchainWallet) {
    await prisma.blockchainWallet.create({
      data: {
        userId,
        walletId: wallet.id,
        network: null,
        address: null,
      },
    });
  }

  // 4) Re-read with relations for a complete return
  const full = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      balances: { include: { token: true } },
      blockchainWallet: true,
    },
  });

  return full!; // safe now
}