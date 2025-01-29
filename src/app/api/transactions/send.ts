import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { to, amount } = await request.json();
    if (!to || !amount) {
      return NextResponse.json({ error: 'Recipient and amount required' }, { status: 400 });
    }

    // ✅ Save transaction (custodial, no blockchain logic)
    const transaction = await prisma.transaction.create({
      data: {
        userEmail: session.user.email,
        to,
        amount: parseFloat(amount),
      },
    });

    console.log(`✅ Transaction saved: ${transaction.id}`);

    return NextResponse.json({ success: true, transactionId: transaction.id });
  } catch (error) {
    console.error('❌ Error saving transaction:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}