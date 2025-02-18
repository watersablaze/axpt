import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ Corrected Import
import { authOptions } from "@/lib/auth"; // ✅ Corrected Import
import { getServerSession } from "next-auth";
import { ethers } from "ethers"; // ✅ Ensure ethers is installed correctly

export async function GET(request: Request) {
  try {
    console.log("🔵 Starting dashboard wallet retrieval process...");

    // ✅ Ensure authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.error("❌ Authentication failed: No session or user email.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`✅ Authenticated user: ${session.user.email}`);

    // ✅ Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error("❌ User not found in the database.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.walletAddress) {
      console.error("❌ Wallet address is missing.");
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    console.log(`🔵 Fetching wallet balance for address: ${user.walletAddress}`);

    // ✅ Ensure provider URL is configured
    if (!process.env.NEXT_PUBLIC_PROVIDER_URL) {
      console.error("❌ NEXT_PUBLIC_PROVIDER_URL is missing.");
      return NextResponse.json({ error: "Blockchain provider URL is not set" }, { status: 500 });
    }

    // ✅ Connect to blockchain provider
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_PROVIDER_URL);

    // ✅ Fetch wallet balance
    let formattedBalance = "0.00";
    try {
      const balance = await provider.getBalance(user.walletAddress);
      formattedBalance = ethers.formatEther(balance);
    } catch (error: unknown) {
      console.error(`❌ Error fetching wallet balance:`, (error as Error).message || error);
      formattedBalance = "Unavailable";
    }

    console.log(`✅ Wallet balance: ${formattedBalance} ETH`);

    // ✅ Return wallet data
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
        avatar: user.avatar || "/default-user.png", // ✅ Include avatar
      },
    });
  } catch (error: unknown) {
    console.error("❌ Error in wallet API:", (error as Error).message || error);
    return NextResponse.json(
      { error: "Failed to fetch wallet information. Please try again later." },
      { status: 500 }
    );
  }
}