import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ethers } from 'ethers';

export async function GET(request: Request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.warn('⚠️ No authenticated user found.');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('👤 Authenticated user:', session.user.email);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.warn(`⚠️ User not found: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.walletAddress) {
      console.warn(`⚠️ No wallet found for: ${session.user.email}`);
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (!ethers.utils.isAddress(user.walletAddress)) {
      console.warn(`⚠️ Invalid wallet address: ${user.walletAddress}`);
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Validate Provider URL
    const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL;
    if (!providerUrl) {
      console.error("❌ Missing provider URL. Check .env file.");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    let formattedBalance = '0.00';

    try {
      const balance = await provider.getBalance(user.walletAddress);
      formattedBalance = ethers.utils.formatEther(balance);
    } catch (error: any) {
      console.error('❌ Error fetching wallet balance:', error);
    
      if (error instanceof Error && (error as any).code === 'NETWORK_ERROR') {
        return NextResponse.json(
          { error: "Network error while fetching balance. Ensure provider URL is correct." },
          { status: 500 }
        );
      }
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
      { error: 'Failed to fetch wallet information. Please try again.' },
      { status: 500 }
    );
  }
}