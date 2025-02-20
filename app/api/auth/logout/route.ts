import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // ✅ Ensure Prisma is imported

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: No active session" },
        { status: 401 }
      );
    }

    // ✅ Ensure `jti` exists in the token before revoking
    if (!session.user.id) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 400 });
    }

    // ✅ Revoke the JWT by storing it in Prisma
    await prisma.revokedToken.create({
      data: {
        jti: session.user.id, 
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Expire in 30 mins
      },
    });

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    console.error("❌ Logout error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}