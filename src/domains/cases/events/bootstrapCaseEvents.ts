import { registerCaseEventHandler } from "./caseEventBus"
import { prisma } from "@/infrastructure/db/prisma"

let bootstrapped = false

export function bootstrapCaseEvents() {

  if (bootstrapped) return
  bootstrapped = true

  const logEvent = async (event: any) => {

    await prisma.eventLog.create({
      data: {
        caseId: event.payload.caseId,
        type: event.name,
        payload: event.payload.metadata ?? {}
      }
    })

  }

  registerCaseEventHandler("CASE_CREATED", logEvent)
  registerCaseEventHandler("CASE_OPENED", logEvent)
  registerCaseEventHandler("CASE_COMPLETED", logEvent)
  registerCaseEventHandler("PARTY_ADDED", logEvent)
  registerCaseEventHandler("ARTIFACT_UPLOADED", logEvent)
  registerCaseEventHandler("GATE_ACTIVATED", logEvent)
  registerCaseEventHandler("GATE_VERIFIED", logEvent)
  registerCaseEventHandler("GATE_REJECTED", logEvent)
  registerCaseEventHandler("ESCROW_LOCKED", logEvent)
  registerCaseEventHandler("ESCROW_RELEASED", logEvent)

}