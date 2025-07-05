// app/api/wallet/create/route.ts
import prisma from '@/lib/prisma';
import { getLoggedInUserId } from '@/utils/session';
import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

function generateSecureWalletAddress(userId: string): string {
  const entropy = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${userId}-${entropy}`).digest('hex');
  return `AXPT-${hash.slice(0, 10).toUpperCase()}`;
}

export async function POST() {
  const userId = await getLoggedInUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.wallet.findFirst({ where: { userId } });
  if (existing) {
    return NextResponse.json({ message: 'Wallet already exists', wallet: existing }, { status: 200 });
  }

  const wallet = await prisma.wallet.create({
    data: {
      userId,
      address: generateSecureWalletAddress(userId),
      balance: 0,
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}