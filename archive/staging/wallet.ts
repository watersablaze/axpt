// app/src/lib/wallet.ts
import prisma from '@/lib/prisma';

export async function createWalletForUser(userId: string) {
  const existing = await prisma.wallet.findFirst({ where: { userId } });

  if (!existing) {
    await prisma.wallet.create({
      data: {
        userId,
        address: `AXPT-${userId.slice(0, 8)}`, // 🔧 Simple demo address
        balance: 0,
      },
    });
  }
}