import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { caseId, decision, operatorId, reason } = body

    if (!caseId || !decision || !operatorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const normalizedDecision = String(decision).toUpperCase()

    const record = await prisma.interventionDecision.create({
      data: {
        caseId,
        operatorId,
        decision: normalizedDecision,
        reason: reason || null,
      },
    })

await prisma.operatorProfile.upsert({
  where: { operatorId },
  update: {
    totalDecisions: { increment: 1 },

    approveCount:
      normalizedDecision === "APPROVE"
        ? { increment: 1 }
        : undefined,

    delayCount:
      normalizedDecision === "DELAY"
        ? { increment: 1 }
        : undefined,

    overrideCount:
      normalizedDecision === "OVERRIDE"
        ? { increment: 1 }
        : undefined,

    lastActiveAt: new Date(),
  },
  create: {
    operatorId,
    totalDecisions: 1,
    approveCount: normalizedDecision === "APPROVE" ? 1 : 0,
    delayCount: normalizedDecision === "DELAY" ? 1 : 0,
    overrideCount: normalizedDecision === "OVERRIDE" ? 1 : 0,
    successRate: 1,
  },
})

    return NextResponse.json({
      success: true,
      decision: record,
    })
  } catch (err: any) {
    console.error("INTERVENTION ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    )
  }
}