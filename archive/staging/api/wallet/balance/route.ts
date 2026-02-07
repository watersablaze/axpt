import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { wallets: true },
  });

  if (!user || !user.wallets || user.wallets.length === 0) {
    return NextResponse.json({ balance: 0 });
  }

  return NextResponse.json({ balance: user.wallets[0].balance });
}