import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { EventTypes } from '@/core/events/types'
import { appendIncidentLifecycleEvent } from '@/core/events/appendIncidentLifecycleEvent'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const body = await req.json()

  const action = body?.action

  if (
    action !== 'ACKNOWLEDGE' &&
    action !== 'RESOLVE'
  ) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_ACTION' },
      { status: 400 }
    )
  }

  const now = new Date()
  const operatorId = principal.userId
  const operatorEmail = principal.email

  const updated =
    action === 'ACKNOWLEDGE'
      ? await prisma.activeIncident.update({
          where: { incidentKey: id },
          data: {
            acknowledged: true,
            acknowledgedAt: now,
            acknowledgedBy: operatorEmail,
          },
        })
      : await prisma.activeIncident.update({
          where: { incidentKey: id },
          data: {
            resolved: true,
            resolvedAt: now,
            resolvedBy: operatorEmail,
          },
        })

  await prisma.incidentActionLog.create({
    data: {
      incidentKey: id,
      action,
      operatorId,
      operatorEmail,
    },
  })

  await appendIncidentLifecycleEvent({
    incidentKey: id,
    action:
      action === 'ACKNOWLEDGE'
        ? EventTypes.INCIDENT_ACKNOWLEDGED
        : EventTypes.INCIDENT_RESOLVED,
    streamType: updated.streamType,
    operatorEmail,
    operatorId,
  })

  return NextResponse.json({
    ok: true,
    incident: updated,
  })
}