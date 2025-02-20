import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { avatar: true },
  });

  if (user?.avatar) {
    const filePath = path.join(process.cwd(), "public", user.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // ✅ Delete file
  }

  // ✅ Remove avatar path from DB
  await prisma.user.update({
    where: { email: session.user.email },
    data: { avatar: null },
  });

  return NextResponse.json({ success: true });
}