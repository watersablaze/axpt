import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import { EventTypes } from "@/core/events/types"
import { releaseLock } from "@/core/queue/lock"
import { requireAnyPermission } from "@/domains/auth/requirePermission"

import {
  ActionPermissions,
  isAdminAction,
} from "@/domains/auth/actionPermissions"

export async function POST(req: Request) {
  const { caseId, action, operatorId } = await req.json()

  if (!caseId || !action || !operatorId) {
    return NextResponse.json(
      { error: "Missing caseId, action, or operatorId" },
      { status: 400 }
    )
  }

  if (!isAdminAction(action)) {
    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    )
  }

  let principal

  try {
    principal = await requireAnyPermission(ActionPermissions[action])
  } catch {
    await releaseLock(caseId, operatorId)

    return NextResponse.json(
      { error: "Unauthorized action" },
      { status: 403 }
    )
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      switch (action) {
        case "LOCK_ESCROW":
          await appendDomainEvent({
            streamType: "CASE",
            streamId: caseId,
            eventType: EventTypes.ESCROW_LOCKED,
            payload: {
              actor: principal.email,
              operatorId,
            },
          })
          break

        case "RELEASE_ESCROW":
          await appendDomainEvent({
            streamType: "CASE",
            streamId: caseId,
            eventType: EventTypes.ESCROW_RELEASED,
            payload: {
              actor: principal.email,
              operatorId,
            },
          })
          break

        case "FLAG_REVIEW":
          await appendDomainEvent({
            streamType: "CASE",
            streamId: caseId,
            eventType: EventTypes.CASE_FLAGGED,
            payload: {
              actor: principal.email,
              operatorId,
            },
          })
          break
      }

      await tx.queueHistory.create({
        data: {
          caseId,
          action,
          operatorId,
          metadata: {
            actor: principal.email,
            source: "action-execution",
          },
        },
      })

      await tx.queueItem.updateMany({
        where: { caseId },
        data: {
          assignedTo: operatorId,
        },
      })
    })

    await releaseLock(caseId, operatorId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    await releaseLock(caseId, operatorId)

    return NextResponse.json(
      { error: err.message || "Execution failed" },
      { status: 500 }
    )
  }
}