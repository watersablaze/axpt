// 🔁 TEMP PATCHED IMPORTS — will be reverted after clean build

import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma.temp.temp";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth.temp.temp";

export async function GET() { 
  try {
  /*  const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn("⚠️ No authenticated user found.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("👤 Authenticated user:", session.user.email);

    // ✅ Fetch user wallet data from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        walletAddress: true,
        walletBalance: true,
      },
    });

    if (!user) {
      console.warn("⚠️ User not found.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.walletAddress) {
      console.warn("⚠️ Wallet not assigned to user.");
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }
      */

    return NextResponse.json({
      success: true,
      wallet: {
       // address: user.walletAddress,
       //balance: (user.walletBalance ?? 0).toFixed(6),
      },
    });
  } catch (err) {
    console.error("❌ Error in /api/dashboard:", err);
    return NextResponse.json(
      { error: "Failed to fetch wallet information" },
      { status: 500 }
    );
  }
} 