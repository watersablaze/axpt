import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Ensure this import is correct
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { avatar: true },
    });

    if (!user || !user.avatar) {
      return NextResponse.json({ avatar: null }); // Return null if no avatar found
    }

    return NextResponse.json({ avatar: user.avatar }); // ✅ Return avatar URL
  } catch (error: unknown) {
    console.error("❌ Error fetching avatar:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}