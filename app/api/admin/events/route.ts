import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const events = await prisma.domainEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 25,
  })

  return NextResponse.json(
    events.map((e: (typeof events)[number]) => ({
      type: e.eventType,
      createdAt: e.occurredAt,
      streamId: e.streamId,
    }))
  )
}