import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ensure Prisma is correctly set up

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10, // Limit the results
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transaction history' },
      { status: 500 }
    );
  }
}