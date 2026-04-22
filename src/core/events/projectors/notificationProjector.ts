// src/core/events/projectors/notificationProjector.ts
import { prisma } from "@/lib/prisma"

type DomainEventRecord = {
  eventType: string
  payload: any
}

export async function projectNotification(event: DomainEventRecord) {
  const { eventType, payload } = event

  if (eventType === "CASE_CREATED") {
    await prisma.notificationReadModel.create({
      data: {
        caseId: payload.caseId,
        actorRole: "TREASURY",
        message: "New case created",
        severity: "INFO",
      },
    })
  }

  if (eventType === "CASE_STATUS_CHANGED") {
    const from = payload?.metadata?.from ?? "UNKNOWN"
    const to = payload?.metadata?.to ?? "UNKNOWN"

    await prisma.notificationReadModel.create({
      data: {
        caseId: payload.caseId,
        actorUserId: payload.actorUserId ?? null,
        message: `Case status changed from ${from} to ${to}`,
        severity: "INFO",
      },
    })
  }

  if (eventType === "GATE_VERIFIED") {
    await prisma.notificationReadModel.create({
      data: {
        caseId: payload.caseId,
        actorUserId: payload.actorUserId ?? null,
        message: "Gate verified",
        severity: "INFO",
      },
    })
  }

  if (eventType === "ESCROW_LOCKED") {
    await prisma.notificationReadModel.create({
      data: {
        caseId: payload.caseId,
        actorRole: "TREASURY",
        message: "Escrow locked",
        severity: "WARNING",
      },
    })
  }

  if (eventType === "ESCROW_RELEASED") {
    await prisma.notificationReadModel.create({
      data: {
        caseId: payload.caseId,
        actorRole: "TREASURY",
        message: "Escrow released",
        severity: "INFO",
      },
    })
  }
}