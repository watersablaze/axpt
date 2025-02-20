import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    console.log("🔄 Fetching wallet details...");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error("🚨 Unauthorized access attempt.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`✅ User authenticated: ${session.user.email}`);

    // ✅ Fetch user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        industry: true,
        interests: true,
        walletAddress: true,
        walletBalance: true,
        avatar: true,
      },
    });

    if (!user) {
      console.error("❌ User not found in database.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error in /api/wallet:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}