import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  if (!user || !user.walletAddress) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  const balance = '0.00'; // Placeholder for actual wallet balance logic

  return NextResponse.json({
    wallet: {
      address: user.walletAddress,
      balance,
    },
  });
}