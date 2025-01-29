import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ethers } from 'ethers';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      console.warn('⚠️ No authenticated user found in session.');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('👤 Authenticated user:', session.user.email);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.warn(`⚠️ User not found in database: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.walletAddress) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (!ethers.utils.isAddress(user.walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // ✅ New Provider Initialization
    const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL;
    if (!providerUrl) {
      console.error('❌ Missing provider URL. Check .env file.');
      return NextResponse.json({ error: 'Blockchain provider unavailable' }, { status: 500 });
    }

    console.log(`🔗 Connecting to provider: ${providerUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    try {
      const network = await provider.getNetwork();
      console.log(`🌍 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    } catch (networkError) {
      console.error('❌ Failed to detect network:', networkError);
      return NextResponse.json({
        error: 'Network error: Could not connect to provider',
        wallet: {
          address: user.walletAddress,
          balance: '0.00',
        },
      });
    }

    // Fetch wallet balance
    let formattedBalance = '0.00';
    try {
      const balance = await provider.getBalance(user.walletAddress);
      formattedBalance = ethers.utils.formatEther(balance);
    } catch (balanceError) {
      console.error('❌ Error fetching wallet balance:', balanceError);
      return NextResponse.json({
        error: 'Network error: Could not retrieve wallet balance',
        wallet: {
          address: user.walletAddress,
          balance: '0.00',
        },
      });
    }

    console.log('✅ Returning wallet data:', {
      address: user.walletAddress,
      balance: formattedBalance,
    });

    return NextResponse.json({
      success: true,
      wallet: {
        address: user.walletAddress,
        balance: formattedBalance,
      },
    });
  } catch (error) {
    console.error('❌ Unexpected error in /api/dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet information' },
      { status: 500 }
    );
  }
}