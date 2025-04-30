import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // ✅ Save image locally in public/uploads/
  const uploadDir = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = `/uploads/${session.user.email}.png`;
  const buffer = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(`./public${filePath}`, buffer); // ✅ Save image

  // ✅ Update user profile with new avatar path
  await prisma.user.update({
    where: { email: session.user.email },
    data: { avatar: filePath }, // ✅ Ensure Prisma has `avatar` field
  });

  return NextResponse.json({ success: true, avatar: filePath });
}