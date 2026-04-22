import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import { EventTypes } from "@/core/events/types"
import { updateOperatorReputation } from "@/core/automation/reputation"
import { prisma } from "@/lib/prisma"
import { getGlobalAwareness } from "./getGlobalAwareness"

type CouncilResult = {
  finalDecision: "APPROVE" | "DELAY" | "OVERRIDE" | null
  confidence: number
  reason: string
  breakdown?: Record<string, number>
  signals?: {
    human: number
    system: number
  }
}

type Context = {
  allVerified: boolean
  hoursOpen: number
  hoursInEscrow?: number
  cooldown: boolean
}

export async function executeCouncilDecision({
  caseId,
  council,
  context,
  operators,
}: {
  caseId: string
  council: CouncilResult
  context: Context
  operators: {
    operatorId: string
    decision?: "APPROVE" | "DELAY" | "OVERRIDE"
  }[]
}) {
  let result = {
    executed: false,
    action: "NO_DECISION",
    reason: "No council decision",
  }

  // =========================
  // GLOBAL AWARENESS
  // =========================

  const global = await getGlobalAwareness()

  const escalation = global?.escalation

  // =========================
  // 🚫 HARD BLOCK (CRITICAL)
  // =========================

  if (escalation?.effects?.requireHuman) {
    return {
      executed: false,
      action: "BLOCKED_ESCALATION",
      reason: "Human intervention required",
    }
  }

      await appendDomainEvent({
        streamType: "SYSTEM",
        streamId: caseId,
        eventType: "ESCALATION_BLOCK",
        payload: {
          escalationLevel: escalation.level,
        },
      })

  // =========================
  // 🧠 AUTHORITY ADJUSTMENT
  // =========================

  let adjustedConfidence = council.confidence

  if (escalation?.level === "DEGRADED") {
    adjustedConfidence -= 0.05
  }

  if (escalation?.level === "CRITICAL") {
    if (council.finalDecision === "OVERRIDE") {
      adjustedConfidence += 0.08
    } else {
      adjustedConfidence -= 0.1
    }
  }

  // =========================
  // MINIMUM CONFIDENCE GATE
  // =========================

  const threshold =
    escalation?.level === "DEGRADED"
      ? 0.8
      : escalation?.level === "CRITICAL"
      ? 0.85
      : 0.72

  if (!council.finalDecision || adjustedConfidence < threshold) {
    return {
      executed: false,
      action: "INSUFFICIENT_CONFIDENCE",
      reason: "Confidence below threshold",
    }
  }

  // =========================
  // APPROVE → RELEASE
  // =========================

  if (council.finalDecision === "APPROVE") {
    if (!context.allVerified) {
      return {
        executed: false,
        action: "APPROVE_BLOCKED",
        reason: "Not all gates verified",
      }
    }

    await prisma.case.update({
      where: { id: caseId },
      data: { status: "SETTLED_RELEASED" },
    })

    await appendDomainEvent({
      streamType: "CASE",
      streamId: caseId,
      eventType: EventTypes.ESCROW_RELEASED,
      payload: {
        actor: "COUNCIL",
        reason: council.reason,
      },
    })

    result = {
      executed: true,
      action: "RELEASED",
      reason: council.reason,
    }
  }

  // =========================
  // DELAY → HOLD
  // =========================

  else if (council.finalDecision === "DELAY") {
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "ESCROW_HOLD" },
    })

    result = {
      executed: true,
      action: "HELD",
      reason: council.reason,
    }
  }

  // =========================
  // OVERRIDE → DISPUTE
  // =========================

  else if (council.finalDecision === "OVERRIDE") {
    if (context.cooldown) {
      return {
        executed: false,
        action: "OVERRIDE_BLOCKED",
        reason: "Cooldown active",
      }
    }

    await prisma.case.update({
      where: { id: caseId },
      data: { status: "ESCROW_DISPUTED" },
    })

    await appendDomainEvent({
      streamType: "CASE",
      streamId: caseId,
      eventType: EventTypes.CASE_FLAGGED,
      payload: {
        actor: "COUNCIL",
        reason: council.reason,
      },
    })

    result = {
      executed: true,
      action: "DISPUTED",
      reason: council.reason,
    }
  }

  // =========================
  // 🧠 OPERATOR MEMORY UPDATE
  // =========================

  if (result.executed && council.finalDecision) {
    for (const op of operators) {
      if (!op.decision) continue

      const wasCorrect =
        op.decision === council.finalDecision

      await updateOperatorReputation({
        operatorId: op.operatorId,
        wasCorrect,
      })
    }
  }

  return result
}