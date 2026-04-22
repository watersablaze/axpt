export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type OperatorDecision = "APPROVE" | "DELAY" | "OVERRIDE"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params

  const body = await req.json()
  const { operatorId, decision } = body as {
    operatorId: string
    decision: OperatorDecision
  }

  if (!operatorId || !decision) {
    return NextResponse.json(
      { ok: false, error: "INVALID_INPUT" },
      { status: 400 }
    )
  }

  // SAVE DECISION
  await prisma.interventionDecision.create({
    data: { caseId, operatorId, decision },
  })

  // UPDATE ACTIVITY
await prisma.operatorProfile.upsert({
  where: { operatorId },
  update: {
    lastActiveAt: new Date(),
  },
  create: {
    operatorId,
    lastActiveAt: new Date(),
    weightedScore: 1,
  },
})

  // =========================
  // DIRECTIONAL TRUST UPDATE
  // =========================
  const others = await prisma.interventionDecision.findMany({
    where: {
      caseId,
      operatorId: { not: operatorId },
    },
  })

  for (const other of others) {
    const agree = other.decision === decision

    const existing = await prisma.operatorTrust.findUnique({
      where: {
        fromOperatorId_toOperatorId: {
          fromOperatorId: operatorId,
          toOperatorId: other.operatorId,
        },
      },
    })

    const agreementCount = (existing?.agreementCount ?? 0) + (agree ? 1 : 0)
    const disagreementCount = (existing?.disagreementCount ?? 0) + (agree ? 0 : 1)

    const total = agreementCount + disagreementCount
    const trustScore = total > 0 ? agreementCount / total : 1

    await prisma.operatorTrust.upsert({
      where: {
        fromOperatorId_toOperatorId: {
          fromOperatorId: operatorId,
          toOperatorId: other.operatorId,
        },
      },
      update: {
        agreementCount,
        disagreementCount,
        trustScore,
        lastUpdatedAt: new Date(),
      },
      create: {
        fromOperatorId: operatorId,
        toOperatorId: other.operatorId,
        agreementCount,
        disagreementCount,
        trustScore,
      },
    })
  }

  return NextResponse.json({ ok: true })
}