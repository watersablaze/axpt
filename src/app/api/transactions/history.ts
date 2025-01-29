import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log("👤 Fetching transactions for:", session.user.email);

    // Fetch user's transaction history from database
    const transactions = await prisma.transaction.findMany({
      where: { userEmail: session.user.email },
      orderBy: { createdAt: 'desc' },
    });

    console.log("✅ Transactions loaded:", transactions.length);

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("❌ Error loading transactions:", error);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
}