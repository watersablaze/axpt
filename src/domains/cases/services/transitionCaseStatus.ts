import { prisma } from "@/lib/prisma"
import type { CaseStatus } from "@/shared/types/case"
import { canTransitionCaseStatus } from "../policies/caseStateMachine"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"

export async function transitionCaseStatus(
  caseId: string,
  to: CaseStatus,
  actorUserId?: string
) {

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      status: true,
    },
  })

  if (!caseRecord) {
    throw new Error("Case not found")
  }

  const from = caseRecord.status as CaseStatus

  if (!canTransitionCaseStatus(from, to)) {
    throw new Error(`Invalid case status transition: ${from} → ${to}`)
  }

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      status: to,
      openedAt: to === "OPEN" ? new Date() : undefined,
      completedAt: to === "COMPLETED" ? new Date() : undefined,
    },
  })

  await appendDomainEvent({
    streamType: "CASE",
    streamId: caseId,
    eventType: "CASE_STATUS_CHANGED",
    payload: {
      caseId,
      actorUserId,
      metadata: {
        from,
        to
      }
    }
  })

  return updated
}