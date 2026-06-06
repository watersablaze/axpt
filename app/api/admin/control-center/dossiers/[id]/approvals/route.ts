import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { EventTypes } from '@/core/events/types'

type ApprovalBody = {
  transitionKey?: string
  requiredRole?: string
  note?: string
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = (await req.json()) as ApprovalBody

    if (!body.transitionKey) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_TRANSITION_KEY' },
        { status: 400 }
      )
    }

    const requiredRole =
      body.requiredRole ?? 'ADMIN_PLATFORM'

    if (!principal.roles.includes(requiredRole)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'APPROVAL_ROLE_NOT_HELD',
          requiredRole,
        },
        { status: 403 }
      )
    }

    const dossier =
      await prisma.transactionDossier.findUnique({
        where: { id },
      })

    if (!dossier) {
      return NextResponse.json(
        { ok: false, error: 'DOSSIER_NOT_FOUND' },
        { status: 404 }
      )
    }

    const requirement =
      await prisma.dossierApprovalRequirement.upsert({
        where: {
          dossierId_transitionKey_requiredRole: {
            dossierId: dossier.id,
            transitionKey: body.transitionKey,
            requiredRole,
          },
        },
        create: {
          dossierId: dossier.id,
          transitionKey: body.transitionKey,
          requiredRole,
          requiredCount: 1,
          status: 'PENDING',
        },
        update: {},
      })

    const grant =
      await prisma.dossierApprovalGrant.upsert({
        where: {
          requirementId_operatorEmail: {
            requirementId: requirement.id,
            operatorEmail: principal.email,
          },
        },
        create: {
          requirementId: requirement.id,
          operatorEmail: principal.email,
          operatorId: null,
          roleKey: requiredRole,
          decision: 'APPROVED',
          note: body.note,
        },
        update: {
          decision: 'APPROVED',
          note: body.note,
        },
      })

    const approvalCount =
      await prisma.dossierApprovalGrant.count({
        where: {
          requirementId: requirement.id,
          decision: 'APPROVED',
        },
      })

    const updatedRequirement =
      await prisma.dossierApprovalRequirement.update({
        where: { id: requirement.id },
        data: {
          status:
            approvalCount >= requirement.requiredCount
              ? 'SATISFIED'
              : 'PENDING',
        },
        include: {
          approvals: true,
        },
      })

    await prisma.transactionDossierEvent.create({
      data: {
        dossierId: dossier.id,
        eventType: EventTypes.DOSSIER_APPROVAL_GRANTED,
        fromState: null,
        toState: null,
        message: `${principal.email} approved ${body.transitionKey}.`,
        actor: principal.email,
        metadata: {
          source: 'control-center.approvals',
          transitionKey: body.transitionKey,
          requiredRole,
          approvalGrantId: grant.id,
          requirementId: requirement.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      requirement: updatedRequirement,
      grant,
    })
  } catch (err) {
    console.error(
      '[DOSSIER_APPROVAL_ROUTE_FAILED]',
      err
    )

    return NextResponse.json(
      {
        ok: false,
        error: 'DOSSIER_APPROVAL_ROUTE_FAILED',
        detail:
          err instanceof Error
            ? err.message
            : String(err),
      },
      { status: 500 }
    )
  }
}