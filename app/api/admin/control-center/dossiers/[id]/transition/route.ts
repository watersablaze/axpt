import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { appendDomainEvent } from '@/core/events/appendDomainEvent'
import { EventTypes } from '@/core/events/types'

import {
  canTransitionDossier,
} from '@/domains/control-center/dossierStateMachine'

import {
  checkDossierArtifactGate,
} from '@/domains/control-center/dossierArtifactGates'

import {
  orchestrateDossierTransition,
} from '@/domains/control-center/orchestrateDossierTransition'

type DossierTransitionBody = {
  toState?: string
  message?: string
  metadata?: Record<string, unknown>
}

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
  const body = (await req.json()) as DossierTransitionBody

  if (!body.toState) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_TO_STATE' },
      { status: 400 }
    )
  }

  const dossier =
    await prisma.transactionDossier.findUnique({
      where: { id },
      include: {
        instruments: true,
      },
    })

  if (!dossier) {
    return NextResponse.json(
      { ok: false, error: 'DOSSIER_NOT_FOUND' },
      { status: 404 }
    )
  }

  const fromState = dossier.state
  const toState = body.toState as typeof dossier.state

  if (!canTransitionDossier(fromState, toState)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_DOSSIER_TRANSITION',
        fromState,
        toState,
      },
      { status: 400 }
    )
  }

  const gate = checkDossierArtifactGate({
    fromState,
    toState,
    instruments: dossier.instruments,
  })

  if (!gate.passed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DOSSIER_ARTIFACT_GATE_BLOCKED',
        reason: gate.blockingReason,
        fromState,
        toState,
        checks: gate.checks,
      },
      { status: 409 }
    )
  }

  const message =
    body.message ??
    `Dossier transitioned from ${fromState} to ${toState}.`

  try {
    const orchestration =
      await orchestrateDossierTransition({
        dossier,
        fromState,
        toState,
        principal,
      })
    const updated =
      await prisma.transactionDossier.update({
        where: { id },
        data: {
          state: toState,
        },
      })

    const event =
      await prisma.transactionDossierEvent.create({
        data: {
          dossierId: dossier.id,
          eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
          fromState,
          toState,
          message,
          actor: principal.email,
          metadata: {
            source: 'control-center.transition',
            operatorId: null, 
            operatorEmail: principal.email,
            ...(body.metadata ?? {}),
          },
        },
      })

    await appendDomainEvent({
      streamType: 'DOSSIER',
      streamId: dossier.reference,
      eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
      payload: {
        dossierId: dossier.id,
        reference: dossier.reference,
        fromState,
        toState,
        message,
      },
      metadata: {
        source: 'dossier.transition',
        operatorId: null, 
        operatorEmail: principal.email,
        dossierId: dossier.id,
        reference: dossier.reference,
      },
    })

    return NextResponse.json({
      ok: true,
      dossier: updated,
      event,
      orchestration,
    })
  } catch (err) {
    console.error(
      '[DOSSIER_TRANSITION_FAILED]',
      err
    )

    return NextResponse.json(
      {
        ok: false,
        error: 'DOSSIER_TRANSITION_FAILED',
      },
      { status: 500 }
    )
  }
}