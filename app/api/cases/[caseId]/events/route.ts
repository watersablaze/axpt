import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _: Request,
  { params }: { params: { caseId: string } }
) {
  const events = await prisma.domainEvent.findMany({
    where: {
      streamType: "CASE",
      streamId: params.caseId,
    },
    orderBy: {
      occurredAt: "asc",
    },
  })

  return NextResponse.json(
    events.map((e: (typeof events)[number]) => ({
      id: e.id,
      type: e.eventType,
      timestamp: e.occurredAt,
      payload: e.payload,
    }))
  )
}