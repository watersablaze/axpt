import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function POST(
  req: Request,
  { params }: { params: { caseId: string } }
) {
  const { caseId } = params

  const c = await prisma.case.findUnique({
    where: { id: caseId },
  })

  if (!c) {
    return NextResponse.json(
      { ok: false },
      { status: 404 }
    )
  }

  // allow dispute from BOTH states
  if (
    c.status !== "ESCROW_INITIATED" &&
    c.status !== "ESCROW_HOLD"
  ) {
    return NextResponse.json(
      { ok: false, error: "INVALID_STATE" },
      { status: 400 }
    )
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.case.update({
      where: { id: caseId },
      data: {
        status: "ESCROW_DISPUTED",
      },
    })

    await tx.eventLog.create({
      data: {
        caseId,
        actor: "AXPT_SYSTEM",
        action: "ESCROW_DISPUTED",
        detail: {},
      },
    })
  })

  return NextResponse.redirect(
    new URL(`/admin/cases/${caseId}`, req.url)
  )
}