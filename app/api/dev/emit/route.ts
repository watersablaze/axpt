import { NextResponse } from "next/server"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"

export async function POST(req: Request) {

  const { type, caseId } = await req.json()

  await appendDomainEvent({
    streamType: "CASE",
    streamId: caseId,
    eventType: type,
    payload: { caseId }
  })

  return NextResponse.json({ ok: true })
}