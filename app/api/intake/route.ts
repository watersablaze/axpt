import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type: string = body?.type || "";

  if (type === "STREAM_STARTED") {
    await db.liveStream.upsert({
      where: { id: "primary" },
      update: { isLive: true },
      create: { id: "primary", isLive: true },
    });
  } else if (type === "STREAM_STOPPED") {
    await db.liveStream.upsert({
      where: { id: "primary" },
      update: { isLive: false },
      create: { id: "primary", isLive: false },
    });
  }

  return NextResponse.json({ ok: true });
}