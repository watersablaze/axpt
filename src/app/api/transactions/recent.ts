import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fetching recent transactions for:', session.user.email);

    // ✅ Ensure "transaction" (singular) is used, NOT "transactions"
    const transactions = await prisma.transaction.findMany({
      where: { userEmail: session.user.email },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
}