import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const events = await prisma.domainEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 40,
  })

 return NextResponse.json({
   ok: true,
   events: events.map((event: (typeof events)[number]) => ({
     id: event.id,
     type: event.eventType,
     streamType: event.streamType,
     streamId: event.streamId,
     occurredAt: event.occurredAt.toISOString(),
     createdAt: event.createdAt.toISOString(),
     metadata: event.metadata,
   })),
 })
}