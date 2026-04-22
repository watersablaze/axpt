import { CaseEventName, CaseDomainEvent } from "./caseEvents"

type Handler = (event: CaseDomainEvent) => Promise<void> | void

const handlers: Record<CaseEventName, Handler[]> = {
  CASE_CREATED: [],
  CASE_OPENED: [],
  CASE_COMPLETED: [],
  CASE_STATUS_CHANGED: [],
  PARTY_ADDED: [],
  ARTIFACT_UPLOADED: [],
  GATE_ACTIVATED: [],
  GATE_VERIFIED: [],
  GATE_REJECTED: [],
  ESCROW_LOCKED: [],
  ESCROW_RELEASED: []
}

export function registerCaseEventHandler(
  eventName: CaseEventName,
  handler: Handler
) {
  handlers[eventName].push(handler)
}

export async function emitCaseEvent(event: CaseDomainEvent) {
  const eventHandlers = handlers[event.name] || []

  for (const handler of eventHandlers) {
    await handler(event)
  }
}