import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    // ✅ Remove all expired revoked tokens
    const deletedTokens = await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: { lte: new Date() }, // Remove where expiresAt is in the past
      },
    });

    console.log(`🗑️ Cleanup: Removed ${deletedTokens.count} expired revoked tokens.`);
    
    return NextResponse.json({ message: `Removed ${deletedTokens.count} expired tokens` });
  } catch (error: unknown) {
    console.error("❌ Error during cleanup:", error);
    return NextResponse.json({ error: "Failed to clean expired tokens" }, { status: 500 });
  }
}