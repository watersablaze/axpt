import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers'; // Correct import for ethers.js
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.walletAddress) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (!ethers.utils.isAddress(user.walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_PROVIDER_URL
    );

    let formattedBalance = '0.00';
    try {
      const balance = await provider.getBalance(user.walletAddress);
      formattedBalance = ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }

    return NextResponse.json({
      wallet: {
        address: user.walletAddress,
        balance: formattedBalance,
      },
    });
  } catch (error) {
    console.error('Error in wallet route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet information' },
      { status: 500 }
    );
  }
}