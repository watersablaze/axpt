import { authOptions } from '@/lib/auth'; // Adjust this path to match your project structure
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !user.walletAddress) {
    return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  }

  // Placeholder for balance from blockchain logic
  const balance = '0.00';

  return NextResponse.json({
    wallet: {
      address: user.walletAddress,
      balance,
    },
  });
}