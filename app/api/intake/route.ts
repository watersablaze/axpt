import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { streamId, status } = await req.json();

  // Update or create the live stream row
  await prisma.liveStream.upsert({
    where: { streamId },
    create: { streamId, status },
    update: { status },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Example listener status for your admin dashboard
  const data = await prisma.liveStream.findMany();
  return NextResponse.json(data);
}