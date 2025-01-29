import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ethers } from 'ethers';
import { decryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.warn("⚠️ No authenticated user.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { to, amount } = await request.json();

    // 🔍 Step 1: Validate input
    if (!to || !amount) {
      return NextResponse.json({ error: "Recipient address and amount are required." }, { status: 400 });
    }
    if (!ethers.utils.isAddress(to)) {
      return NextResponse.json({ error: "Invalid recipient address." }, { status: 400 });
    }
    const parsedAmount = ethers.utils.parseEther(amount);
    if (parsedAmount.lte(0)) {
      return NextResponse.json({ error: "Invalid transaction amount." }, { status: 400 });
    }

    console.log(`🔄 Processing transaction: ${amount} ETH → ${to}`);

    // 🔍 Step 2: Fetch sender details from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.encryptedPrivateKey || !user.iv) {
      return NextResponse.json({ error: "User wallet not found." }, { status: 404 });
    }

    // 🔐 Step 3: Decrypt private key
    let privateKey;
    try {
      privateKey = decryptPrivateKey(user.encryptedPrivateKey, user.iv);
    } catch (error) {
      console.error("❌ Error decrypting private key:", error);
      return NextResponse.json({ error: "Failed to access wallet." }, { status: 500 });
    }

    // 🔗 Step 4: Connect to Ethereum provider
    const providerUrl = process.env.NEXT_PUBLIC_PROVIDER_URL;
    if (!providerUrl) {
      console.error("❌ Missing provider URL.");
      return NextResponse.json({ error: "Blockchain provider unavailable" }, { status: 500 });
    }

    console.log(`🔗 Connecting to provider: ${providerUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    await provider.ready;

    // 🔑 Step 5: Sign & Send Transaction
    const wallet = new ethers.Wallet(privateKey, provider);

    try {
      console.log(`🚀 Sending transaction from ${wallet.address} to ${to}...`);
      const tx = await wallet.sendTransaction({ to, value: parsedAmount });

      console.log(`✅ Transaction sent! Hash: ${tx.hash}`);
      return NextResponse.json({ success: true, txHash: tx.hash });
    } catch (txError) {
      console.error("❌ Transaction error:", txError);
      return NextResponse.json({ error: "Transaction failed. Try again later." }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ Unexpected error in /api/transactions/send:", error);
    return NextResponse.json({ error: "Transaction processing failed." }, { status: 500 });
  }
}