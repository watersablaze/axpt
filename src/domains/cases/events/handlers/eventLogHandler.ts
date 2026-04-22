import { prisma } from "@/infrastructure/db/prisma"
import { CaseDomainEvent } from "../caseEvents"

export async function eventLogHandler(event: CaseDomainEvent) {

  const { payload } = event

  if (!payload.caseId) return

  await prisma.eventLog.create({
    data: {
      caseId: payload.caseId,
      type: event.name,
      payload: payload.metadata ?? {},
      occurredAt: new Date(event.occurredAt)
    }
  })

}