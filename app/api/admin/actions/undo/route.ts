import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import { EventTypes } from "@/core/events/types"

export async function POST(req: Request) {
  const { caseId } = await req.json()

  const lastEvent = await prisma.domainEvent.findFirst({
    where: {
      streamId: caseId,
    },
    orderBy: {
      occurredAt: "desc",
    },
  })

  if (!lastEvent) {
    return NextResponse.json({ error: "No event to undo" }, { status: 400 })
  }

  await appendDomainEvent({
    streamType: "CASE",
    streamId: caseId,
    eventType: EventTypes.ACTION_REVERSED,
    payload: {
      reversedEventId: lastEvent.id,
      reversedType: lastEvent.eventType,
    },
  })

  return NextResponse.json({ success: true })
}