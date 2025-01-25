import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers'; // Correct import for ethers.js
import { authOptions } from '@/lib/auth';
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

  // Example: Retrieve balance using ethers.js
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:3000'); // Replace with your provider URL
  const balance = await provider.getBalance(user.walletAddress);
  const formattedBalance = ethers.utils.formatEther(balance);

  return NextResponse.json({
    wallet: {
      address: user.walletAddress,
      balance: formattedBalance,
    },
  });
}