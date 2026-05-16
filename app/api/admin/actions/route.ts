import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import { EventTypes } from "@/core/events/types"
import { ActionPermissions } from "@/domains/auth/permissions"
import { getDevUser } from "@/lib/auth/devBypass"
import { releaseLock } from "@/core/queue/lock"
import { Prisma } from "@prisma/client"

export async function POST(req: Request) {
  const { caseId, action, operatorId } = await req.json()

  if (!caseId || !action || !operatorId) {
    return NextResponse.json(
      { error: "Missing caseId, action, or operatorId" },
      { status: 400 }
    )
  }

  const user = getDevUser()
  const allowedRoles = ActionPermissions[action]

  if (!allowedRoles || !allowedRoles.includes(user.role)) {
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
              actor: user.email,
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
              actor: user.email,
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
              actor: user.email,
              operatorId,
            },
          })
          break

        default:
          throw new Error("Unknown action")
      }

      await tx.queueHistory.create({
        data: {
          caseId,
          action,
          operatorId,
          metadata: {
            actor: user.email,
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