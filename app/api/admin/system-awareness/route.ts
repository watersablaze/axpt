import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export async function GET() {
  try {
    // =========================
    // 1. LOAD (BATCHED)
    // =========================

    const [cases, activeOperators, trusts, decisions] = await Promise.all([
      prisma.case.findMany({ include: { gates: true } }),

      prisma.operator.findMany({
        where: { isActive: true },
        include: { profile: true },
      }),

      prisma.operatorTrust.findMany(),

      prisma.interventionDecision.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ])

    console.log("cases:", cases.length)
    console.log("operators:", activeOperators.length)
    console.log("trusts:", trusts.length)
    console.log("decisions:", decisions.length)

    const typedCases = cases
    const typedOperators = activeOperators

    // =========================
    // 2. INDEX (CRITICAL)
    // =========================

    const trustMap = new Map<string, number[]>()
    trusts.forEach((t: (typeof trusts)[number]) => {
      if (!trustMap.has(t.fromOperatorId)) {
        trustMap.set(t.fromOperatorId, [])
      }
      trustMap.get(t.fromOperatorId)!.push(t.trustScore)
    })

    const decisionMap = new Map<string, (typeof decisions)[number]>()
    decisions.forEach((d: (typeof decisions)[number]) => {
      decisionMap.set(`${d.caseId}_${d.operatorId}`, d)
    })

    // =========================
    // 3. COMPUTE (PURE)
    // =========================

    const results = typedCases.map((c: (typeof typedCases)[number]) => {
      const operators = typedOperators.map((op: (typeof typedOperators)[number]) => {
        const trustScores = trustMap.get(op.id) || []

        const avgTrust =
          trustScores.length > 0
            ? trustScores.reduce((a: number, b: number) => a + b, 0) /
              trustScores.length
            : 0.8 // ← fallback signal (important)

        const decision =
          decisionMap.get(`${c.id}_${op.id}`)?.decision ?? "APPROVE"

        return {
          operatorId: op.id,
          name: op.name,
          decision,
          successRate: op.profile?.weightedScore ?? 1,
          trustScore: avgTrust,
        }
      })

      const pendingGates = c.gates.filter((g: (typeof c.gates)[number]) => g.status !== "VERIFIED").length
      const createdAtMs =
        c.createdAt instanceof Date ? c.createdAt.getTime() : Date.now()
      const hoursOpen = Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60))
      const timeOpenFactor = clamp(hoursOpen / 72, 0, 0.2)

      // 🔥 lightweight intelligence layer
      let weightedSum = 0
      let totalWeight = 0

      operators.forEach((o: (typeof operators)[number]) => {
        const weight = o.trustScore * o.successRate

        totalWeight += weight

        if (o.decision === "APPROVE") {
          weightedSum += weight
        } else if (o.decision === "DELAY") {
          weightedSum += weight * 0.5
        } else if (o.decision === "OVERRIDE") {
          weightedSum -= weight * 0.3
        }
      })

      const confidence = clamp(
        totalWeight > 0 ? weightedSum / totalWeight : 0,
        0,
        1
      )
      const urgency =
        (pendingGates > 0 ? 0.2 : 0) +
        (c.status === "ESCROW_DISPUTED" ? 0.6 : 0) +
        timeOpenFactor
      const priorityScore = clamp(urgency * 0.6 + confidence * 0.4, 0, 1)
      const alerts: { level: string; message: string }[] = []
      let nextAction = "MONITORING"

      if (confidence < 0.4) {
        alerts.push({ level: "WARNING", message: "Low confidence" })
      }

      if (confidence < 0.25) {
        alerts.push({ level: "CRITICAL", message: "System instability" })
      }

      if (operators.length < 2) {
        alerts.push({ level: "INFO", message: "Low operator participation" })
      }

      if (pendingGates > 0) {
        alerts.push({
          level: "INFO",
          message: `${pendingGates} gates pending`,
        })
      }

      if (pendingGates > 0) {
        nextAction = "AWAITING_VERIFICATION"
      } else if (c.status === "ESCROW_DISPUTED") {
        nextAction = "RESOLVE_DISPUTE"
      }

      return {
        caseId: c.id,
        status: c.status,

        priorityScore,

        nextAction,

        operators,

        council: {
          finalDecision: confidence > 0.6 ? "APPROVE" : "DELAY",
          confidence,
        },

        hierarchy: [],
        momentum: [],
        alerts,
      }
    })

    // =========================
    // 4. RESPOND
    // =========================

    return NextResponse.json({
      items: results,
      count: results.length,
    })
  } catch (err: any) {
    console.error("AWARENESS ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
