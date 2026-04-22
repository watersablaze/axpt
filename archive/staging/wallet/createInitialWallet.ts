import prisma from '@/infrastructure/db/prisma';
import { randomBytes } from 'crypto';

export async function createInitialWallet(userId: string) {
  const existing = await prisma.wallet.findFirst({ where: { userId } });
  if (existing) {
    console.log(`💼 Wallet already exists for user: ${userId}`);
    return existing;
  }

  const address = `AXPT-${randomBytes(4).toString('hex').toUpperCase()}`;

  const wallet = await prisma.wallet.create({
    data: {
      userId,
      address,
      balance: 0,
    },
  });

  console.log(`✅ Created wallet ${address} for user ${userId}`);
  return wallet;
}