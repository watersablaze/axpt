import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Ensure prisma is imported correctly
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() { 
  try {
    // ✅ Handle session safely
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch user from DB safely
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { avatar: true },
    });

    return NextResponse.json({ avatar: user?.avatar || null }); // ✅ Return avatar or null
  } catch (error) {
    console.error("❌ Error fetching avatar:", error instanceof Error ? error.message : error);
    
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}