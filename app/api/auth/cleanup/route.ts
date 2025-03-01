import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    if (!prisma) {
      console.error("❌ Prisma client is unavailable.");
      return NextResponse.json({ error: "Prisma client unavailable" }, { status: 500 });
    }

    const deletedTokens = await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });

    console.log(`🗑️ Cleanup Successful: Removed ${deletedTokens.count} expired revoked tokens.`);
    
    return NextResponse.json({
      message: `Removed ${deletedTokens.count} expired tokens`,
    });
  } catch (error: any) {
    console.error("❌ Prisma Cleanup Error:", error.message || error);
    return NextResponse.json({ error: "Failed to clean expired tokens" }, { status: 500 });
  }
}