import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {

  const cases = await prisma.caseReadModel.findMany()

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
  })

  const grouped = new Map<string, number>()

  for (const e of events) {
    const amount = Number((e.payload as any)?.amount ?? 0)
    grouped.set(e.streamId, (grouped.get(e.streamId) || 0) + amount)
  }

  const result = cases.map((c: (typeof cases)[number]) => {
    const expected = Number(c.expectedAmount ?? 0)
    const actual = grouped.get(c.id) || 0

    let status = "PENDING"
    const anomalies: string[] = []
    const actions: string[] = []

    if (actual === 0) {
      status = "PENDING"
      actions.push("Await funding")
    }

    if (actual > 0 && actual < expected) {
      status = "PARTIAL"
      anomalies.push("Partial funding detected")
      actions.push("Notify counterparty")
      actions.push("Await remaining funds")
    }

    if (actual === expected) {
      status = "FUNDED"
      actions.push("Lock escrow")
      actions.push("Proceed to next gate")
    }

    if (actual > expected) {
      status = "MISMATCH"
      anomalies.push("Overpayment detected")
      actions.push("Review excess funds")
      actions.push("Initiate refund or adjustment")
    }

    return {
      caseId: c.id,
      expected,
      actual,
      status,
      anomalies,
      actions,
    }
  })

  return NextResponse.json(result)
}