import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const events = await prisma.domainEvent.findMany({
    where: {
      eventType: {
        in: [
          "ESCROW_FUNDED",
          "ESCROW_PARTIALLY_FUNDED",
          "ESCROW_MISMATCH",
        ],
      },
    },
    orderBy: { occurredAt: "desc" },
  })

  const grouped = new Map<string, any[]>()

  for (const e of events) {
    const list = grouped.get(e.streamId) || []
    list.push(e)
    grouped.set(e.streamId, list)
  }

  const result = Array.from(grouped.entries()).map(([caseId, events]) => ({
    caseId,
    events: events.map((e) => ({
      type: e.eventType,
      amount: (e.payload as any)?.amount,
      txHash: (e.payload as any)?.txHash,
      createdAt: e.occurredAt,
    })),
  }))

  return NextResponse.json(result)
}