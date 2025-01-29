import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.warn("⚠️ No authenticated user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("👤 Authenticated user:", session.user.email);

    // ✅ Fetch user from the database (custodial wallet setup)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        walletAddress: true,
        walletBalance: true, // ✅ Balance is now managed in the database
      },
    });

    if (!user) {
      console.warn("⚠️ User not found in database.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.walletAddress) {
      console.warn("⚠️ Wallet not assigned to user.");
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    console.log("✅ Returning wallet data:", {
      address: user.walletAddress,
      balance: user.walletBalance.toFixed(6), // Ensure formatted balance
    });

    return NextResponse.json({
      success: true,
      wallet: {
        address: user.walletAddress,
        balance: user.walletBalance.toFixed(6),
      },
    });

  } catch (err: unknown) {
    console.error("❌ Unexpected error in /api/dashboard:", err);
    return NextResponse.json({ error: "Failed to fetch wallet information" }, { status: 500 });
  }
}