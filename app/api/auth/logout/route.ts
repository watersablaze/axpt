import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // ✅ Ensure Prisma is correctly imported

export async function POST() { 
  try {
    // ✅ Securely retrieve session and ensure it's valid
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: No active session or missing user ID" },
        { status: 401 }
      );
    }

    // ✅ Store the revoked token with an expiration time
    await prisma.revokedToken.create({
      data: {
        jti: session.user.id, // Using `id` instead of `jti` for clarity
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expires in 30 minutes
      },
    });

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error occurred" },
      { status: 500 }
    );
  }
}