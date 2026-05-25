import { prisma } from "@/lib/prisma"

export type EventSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARN"
  | "CRITICAL"

type AppendEventInput = {
  streamType: string
  streamId: string
  eventType: string
  payload: Record<string, unknown>
  metadata?: Record<string, unknown>
  severity?: EventSeverity
  source?: string
}

function inferSeverity(eventType: string): EventSeverity {
  if (
    eventType.includes("MISMATCH") ||
    eventType.includes("FAILED") ||
    eventType.includes("ERROR")
  ) {
    return "CRITICAL"
  }

  if (
    eventType.includes("FLAGGED") ||
    eventType.includes("LOCKED") ||
    eventType.includes("PAUSED")
  ) {
    return "WARN"
  }

  if (
    eventType.includes("RELEASED") ||
    eventType.includes("FUNDED") ||
    eventType.includes("CREATED")
  ) {
    return "SUCCESS"
  }

  return "INFO"
}

export async function appendDomainEvent({
  streamType,
  streamId,
  eventType,
  payload,
  metadata,
  severity,
  source = "domain",
}: AppendEventInput) {
  const normalizedMetadata = {
    ...(metadata ?? {}),
    severity: severity ?? inferSeverity(eventType),
    source,
  }

  return prisma.domainEvent.create({
    data: {
      streamType,
      streamId,
      eventType,
      payload,
      metadata: normalizedMetadata,
      occurredAt: new Date(),
    },
  })
}