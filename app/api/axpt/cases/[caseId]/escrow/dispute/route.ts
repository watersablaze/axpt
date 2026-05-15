import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function POST(
  req: Request,
  { params }: { params: { caseId: string } }
) {
  const { caseId } = params
  const body = await req.json().catch(() => ({} as any))
  const escrowId =
    body?.escrowId ?? new URL(req.url).searchParams.get("escrowId")

  if (!escrowId) {
    return NextResponse.json(
      { ok: false, error: "ESCROW_ID_REQUIRED" },
      { status: 400 }
    )
  }

  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
  })

  if (!escrow || escrow.caseId !== caseId) {
    return NextResponse.json(
      { ok: false, error: "ESCROW_NOT_FOUND" },
      { status: 404 }
    )
  }

  // allow dispute from BOTH states
  if (
    escrow.status !== "INITIATED" &&
    escrow.status !== "ACTIVE" &&
    escrow.status !== "FUNDS_LOCKED" &&
    escrow.status !== "ESCROW_INITIATED" &&
    escrow.status !== "ESCROW_HOLD"
  ) {
    return NextResponse.json(
      { ok: false, error: "INVALID_STATE" },
      { status: 400 }
    )
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.escrow.update({
      where: { id: escrow.id },
      data: {
        status: "DISPUTED",
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
