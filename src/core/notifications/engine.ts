import { on } from "@/core/events/eventBus"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"

on("RISK_ALERT", async ({ caseId, severity }) => {
  await appendDomainEvent({
    streamType: "CASE",
    streamId: caseId,
    eventType: "RISK_ALERT",
    payload: {
      severity,
    },
  })
})