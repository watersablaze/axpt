import { prisma } from "@/lib/prisma"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"

/**
 * 🔒 Prevent duplicate automation events
 */
async function shouldEmitAutomationEvent(
  caseId: string,
  eventType: string
) {
  const existing = await prisma.domainEvent.findFirst({
    where: {
      streamType: "CASE",
      streamId: caseId,
      eventType,
      metadata: {
        path: ["source"],
        equals: "automation",
      },
    },
  })

  return !existing
}

export async function runStageAutomation(
  caseId: string,
  stage: string
) {
  switch (stage) {

    case "DOCUMENTS_PENDING":
      if (await shouldEmitAutomationEvent(caseId, "ACTION_REQUIRED")) {
        await appendDomainEvent({
          streamType: "CASE",
          streamId: caseId,
          eventType: "ACTION_REQUIRED",
          payload: {
            message: "Upload required documents",
            priority: "HIGH",
          },
          metadata: { source: "automation" },
        })
      }
      break

    case "READY_FOR_ESCROW":
      if (await shouldEmitAutomationEvent(caseId, "ESCROW_PENDING")) {
        await appendDomainEvent({
          streamType: "CASE",
          streamId: caseId,
          eventType: "ESCROW_PENDING",
          payload: {
            message: "Prepare escrow funding",
          },
          metadata: { source: "automation" },
        })
      }
      break

    case "ESCROW_IN_PROGRESS":
      if (await shouldEmitAutomationEvent(caseId, "MONITOR_ESCROW")) {
        await appendDomainEvent({
          streamType: "CASE",
          streamId: caseId,
          eventType: "MONITOR_ESCROW",
          payload: {
            message: "Monitor incoming funds",
          },
          metadata: { source: "automation" },
        })
      }
      break

    case "ESCROW_COMPLETE":
      if (await shouldEmitAutomationEvent(caseId, "READY_FOR_RELEASE")) {
        await appendDomainEvent({
          streamType: "CASE",
          streamId: caseId,
          eventType: "READY_FOR_RELEASE",
          payload: {
            message: "Review and release escrow",
          },
          metadata: { source: "automation" },
        })
      }
      break

    case "AT_RISK":
      if (await shouldEmitAutomationEvent(caseId, "RISK_ALERT")) {
        await appendDomainEvent({
          streamType: "CASE",
          streamId: caseId,
          eventType: "RISK_ALERT",
          payload: {
            severity: "HIGH",
          },
          metadata: { source: "automation" },
        })
      }
      break
  }
}