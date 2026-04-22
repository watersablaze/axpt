// app/api/admin/operators/decide/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Decision = "APPROVE" | "DELAY" | "OVERRIDE"

function getPermissions(archetype: string) {
  switch (archetype) {
    case "EXECUTOR":
      return { APPROVE: true, DELAY: true, OVERRIDE: false }
    case "ANALYST":
      return { APPROVE: false, DELAY: true, OVERRIDE: false }
    case "GUARDIAN":
      return { APPROVE: false, DELAY: true, OVERRIDE: true }
    default:
      return { APPROVE: false, DELAY: false, OVERRIDE: false }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      caseId,
      operatorId,
      decision,
    }: {
      caseId: string
      operatorId: string
      decision: Decision
    } = body

    // =========================
    // VALIDATION
    // =========================
    if (!caseId || !operatorId || !decision) {
      return NextResponse.json(
        { error: "INVALID_INPUT" },
        { status: 400 }
      )
    }

    // =========================
    // OPERATOR LOOKUP
    // =========================
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    })

    if (!operator) {
      return NextResponse.json(
        { error: "OPERATOR_NOT_FOUND" },
        { status: 404 }
      )
    }

    // =========================
    // PERMISSION CHECK
    // =========================
    const perms = getPermissions(operator.archetype)

    if (!perms[decision]) {
      return NextResponse.json(
        { error: "UNAUTHORIZED_DECISION" },
        { status: 403 }
      )
    }

    // =========================
    // PREVENT SPAM (last vote override)
    // =========================
    await prisma.interventionDecision.deleteMany({
      where: {
        caseId,
        operatorId,
      },
    })

    // =========================
    // STORE DECISION
    // =========================
    await prisma.interventionDecision.create({
      data: {
        caseId,
        operatorId,
        decision,
      },
    })

    // =========================
    // EMIT EVENT (VERY IMPORTANT)
    // =========================
    await prisma.domainEvent.create({
      data: {
        streamId: caseId,
        eventType: "OPERATOR_DECISION",
        payload: {
          operatorId,
          decision,
        },
      },
    })

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("OPERATOR_DECISION_ERROR:", err)

    return NextResponse.json(
      { error: err.message || "UNKNOWN_ERROR" },
      { status: 500 }
    )
  }
}