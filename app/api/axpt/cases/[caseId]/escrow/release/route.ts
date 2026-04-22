export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/infrastructure/db/prisma"
import { PrismaClient } from "@prisma/client"

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  const c = await prisma.case.findUnique({
    where: { id: caseId },
  })

  if (!c) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 }
    )
  }

  if (
    c.status !== "ESCROW_INITIATED" &&
    c.status !== "ESCROW_HOLD"
  ) {
    return NextResponse.json(
      { ok: false, error: "INVALID_STATE" },
      { status: 400 }
    )
  }

  await prisma.$transaction(async (tx: Tx) => {
    await tx.case.update({
      where: { id: caseId },
      data: {
        status: "SETTLED_RELEASED",
      },
    })

    await tx.eventLog.create({
      data: {
        caseId,
        actor: "AXPT_SYSTEM",
        action: "ESCROW_RELEASED",
        detail: {},
      },
    })
  })

  return NextResponse.redirect(
    new URL(`/admin/cases/${caseId}`, req.url)
  )
}