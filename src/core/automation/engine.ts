import { prisma } from "@/lib/prisma"
import { resolveCouncil } from "@/core/automation/council"
import { executeCouncilDecision } from "@/core/automation/executeCouncilDecision"
import type { Case, Gate } from "@prisma/client"
import { predictFuture } from "@/core/automation/predictFuture"
import {
  getRiskScore,
  getUrgencyScore,
  getValueScore,
} from "@/core/queue/scoring"

type AutomationLog = {
  caseId: string
  action: string
  executed: boolean
  reason: string
}

type ScoredCase = Case & { gates: Gate[] } & {
  priorityScore: number
}

export async function runAutomationCycle(): Promise<AutomationLog[]> {
  const logs: AutomationLog[] = []

  const cases: (Case & { gates: Gate[] })[] =
  await prisma.case.findMany({
    include: { gates: true },
  })

  // =========================
  // PRIORITY SCORING
  // =========================
  const scoredCases: ScoredCase[] = cases.map((c) => {
    const urgency = getUrgencyScore(c)
    const risk = getRiskScore(c)
    const value = getValueScore(c)

    return {
      ...c,
      priorityScore:
        urgency * 0.5 +
        risk * 0.3 +
        value * 0.2,
    }
  })

  scoredCases.sort((a, b) => b.priorityScore - a.priorityScore)

  const activeCases = scoredCases.slice(0, 3)

  // =========================
  // LOAD OPERATORS
  // =========================
  const activeOperators = await prisma.operator.findMany({
    where: { isActive: true },
  })

for (const c of activeCases) {
  if (!c.automationEnabled) continue

      // ONLY RUN IN ESCROW
      if (
      c.status !== "ESCROW_INITIATED" &&
      c.status !== "ESCROW_HOLD"
    ) {
    logs.push({
      caseId: c.id,
      action: "SKIPPED_NOT_IN_ESCROW",
      executed: false,
      reason: `Status: ${c.status}`,
    })
    continue
  }

    // =========================
    // DERIVED STATE
    // =========================
    const allVerified =
      c.gates.length > 0 &&
      c.gates.every((g: Gate) => g.status === "VERIFIED")

    const pendingGates =
      c.gates.filter((g: Gate) => g.status !== "VERIFIED").length

    const hoursOpen =
      (Date.now() - new Date(c.createdAt).getTime()) /
      (1000 * 60 * 60)

    const hoursInEscrow =
      c.status === "ESCROW_HOLD"
        ? (Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60)
        : 0

    const lastFlag = await prisma.domainEvent.findFirst({
      where: {
        streamId: c.id,
        eventType: "CASE_FLAGGED",
      },
      orderBy: { createdAt: "desc" },
    })

    const cooldown =
      !!lastFlag &&
      Date.now() - new Date(lastFlag.createdAt).getTime() <
        60 * 60 * 1000

    // =========================
    // 🔮 PREDICTION
    // =========================
    const prediction = predictFuture({
      allVerified,
      hoursOpen,
      hoursInEscrow,
      cooldown,
      pendingGates,
    })

    // =========================
    // OPERATOR DECISIONS
    // =========================
    const operators = await Promise.all(
  activeOperators.map(async (op: typeof activeOperators[number]) => {
        const decision = await prisma.interventionDecision.findFirst({
          where: {
            caseId: c.id,
            operatorId: op.id,
          },
          orderBy: { createdAt: "desc" },
        })

        return {
          operatorId: op.id,
          archetype: op.archetype,
          decision: decision?.decision ?? undefined,
        }
      })
    )

    // =========================
    // COUNCIL (WITH PREDICTION)
    // =========================
    const council = resolveCouncil(operators, prediction)

    // =========================
    // CONFIDENCE GATING
    // =========================
    if (council.confidence < 0.5) {
      logs.push({
        caseId: c.id,
        action: "BLOCKED_LOW_CONFIDENCE",
        executed: false,
        reason: "Below execution threshold",
      })
      continue
    }

    if (council.confidence < 0.65) {
      logs.push({
        caseId: c.id,
        action: "WAITING_SIGNAL",
        executed: false,
        reason: "Insufficient alignment",
      })
      continue
    }

    // =========================
    // EXECUTION
    // =========================
const result = await executeCouncilDecision({
  caseId: c.id,
  council,
  context: {
    allVerified,
    hoursOpen,
    cooldown,
  },
  operators: operators.map((op) => ({
    operatorId: op.operatorId,
    decision: op.decision,
  })),
})

    logs.push({
      caseId: c.id,
      action: result.action,
      executed: result.executed,
      reason: result.reason,
    })
  }

  return logs
}