import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      activeCases,
      pendingGates,
      lockedEscrows,
      alerts,
      waitingSignature,
      waitingArtifact,
      escrowPending,
      recentEvents,
    ] = await Promise.all([
      prisma.case.count({
        where: {
          status: {
            in: [
              "ACTIVE",
              "ESCROW_INITIATED",
              "ESCROW_HOLD",
              "ESCROW_DISPUTED",
            ],
          },
        },
      }),

      prisma.gate.count({
        where: {
          status: {
            not: "VERIFIED",
          },
        },
      }),

      prisma.case.count({
        where: {
          status: "ESCROW_INITIATED",
        },
      }),

      prisma.case.count({
        where: {
          status: "ESCROW_DISPUTED",
        },
      }),

      prisma.gate.count({
        where: {
          status: {
            not: "VERIFIED",
          },
          name: {
            contains: "Signature",
            mode: "insensitive",
          },
        },
      }),

      prisma.artifact.count(),

      prisma.case.count({
        where: {
          status: "ACTIVE",
          gates: {
            every: {
              status: "VERIFIED",
            },
          },
        },
      }),

      prisma.domainEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])

    const nextActions: {
      caseId: string
      message: string
      priority: "HIGH" | "MEDIUM" | "LOW"
    }[] = []

    if (alerts > 0) {
      nextActions.push({
        caseId: "multiple",
        message: "Resolve disputed escrows",
        priority: "HIGH",
      })
    }

    if (escrowPending > 0) {
      nextActions.push({
        caseId: "multiple",
        message: "Lock ready escrows",
        priority: "HIGH",
      })
    }

    if (waitingSignature > 0) {
      nextActions.push({
        caseId: "multiple",
        message: "Collect required signatures",
        priority: "HIGH",
      })
    }

    if (pendingGates > 0) {
      nextActions.push({
        caseId: "multiple",
        message: "Complete verification gates",
        priority: "MEDIUM",
      })
    }

    const bottlenecks = {
      waitingSignature,
      waitingArtifact,
      escrowPending,
    }

    const instabilityScore =
      alerts * 3 +
      Math.min(pendingGates, 10) +
      Math.min(waitingSignature, 10)

    const throughputPressure =
      escrowPending * 2 +
      Math.min(waitingArtifact, 10)

    let systemState = "STABLE"

    if (alerts > 0) {
      systemState = "CRITICAL"
    } else if (waitingSignature > 0 || pendingGates > 5) {
      systemState = "BLOCKED_SIGNATURES"
    } else if (escrowPending > 0) {
      systemState = "AWAITING_ESCROW_LOCK"
    }

    return NextResponse.json({
      activeCases,
      pendingGates,
      lockedEscrows,
      alerts,
      nextActions,
      bottlenecks,
      intelligence: {
        instabilityScore,
        throughputPressure,
        systemState,
      },
      events: recentEvents.map((e: typeof recentEvents[number]) => ({
        type: e.eventType,
        createdAt: e.createdAt,
      })),
    })
  } catch (err: any) {
    console.error("SYSTEM SNAPSHOT ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    )
  }
}