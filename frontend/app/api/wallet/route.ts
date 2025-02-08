import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { ethers } from 'ethers';
import { authOptions } from '../../../../lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    console.log('Starting dashboard wallet retrieval process...');

    // Get the user session to ensure they're authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.error('Authentication failed: No session or user email.');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`Authenticated user: ${session.user.email}`);

    // Fetch the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error('User not found in the database.');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.walletAddress) {
      console.error('Wallet address is missing for the user.');
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    if (!ethers.utils.isAddress(user.walletAddress)) {
      console.error('Invalid wallet address stored in the database.');
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    console.log(`Fetching wallet balance for address: ${user.walletAddress}`);

    // Ensure the blockchain provider URL is set in the environment
    if (!process.env.NEXT_PUBLIC_PROVIDER_URL) {
      console.error('NEXT_PUBLIC_PROVIDER_URL is missing in .env file.');
      return NextResponse.json(
        { error: 'Blockchain provider URL is not configured' },
        { status: 500 }
      );
    }

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_PROVIDER_URL
    );

    // Fetch the wallet balance
    let formattedBalance = '0.00';
    try {
      const balance = await provider.getBalance(user.walletAddress);
      formattedBalance = ethers.utils.formatEther(balance);
    } catch (error: unknown) { // Explicitly set the type as 'unknown'
      console.error(
        `Error fetching wallet balance for ${user.walletAddress}:`,
        (error as Error).message || error
      );
      formattedBalance = 'Unavailable'; // Fallback to indicate failure
    }

    console.log(
      `Wallet balance retrieved successfully: ${formattedBalance} ETH`
    );

    // Return wallet info and user metadata
    return NextResponse.json({
      wallet: {
        address: user.walletAddress,
        balance: formattedBalance,
      },
      user: {
        name: user.name,
        email: user.email,
        industry: user.industry,
        interests: user.interests,
      },
    });
  } catch (error: unknown) { // Explicitly set the type as 'unknown'
    console.error('Error in dashboard route:', (error as Error).message || error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet information. Please try again later.' },
      { status: 500 }
    );
  }
}