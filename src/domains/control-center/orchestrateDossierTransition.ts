
import { prisma } from '@/lib/prisma'

import {
  ensureDossierApprovalRequirements,
} from './ensureDossierApprovalRequirements'

import {
  getTransitionKey,
} from './dossierApprovalGates'

type DossierLike = {
  id: string
  reference: string
  state: string
}

type PrincipalLike = {
  email: string
  roles?: string[]
  permissionCount?: number
}

type OrchestrateDossierTransitionInput = {
  dossier: DossierLike
  fromState: string
  toState: string
  principal: PrincipalLike
}

export async function orchestrateDossierTransition({
  dossier,
  fromState,
  toState,
  principal,
}: OrchestrateDossierTransitionInput) {
  if (
    fromState === 'ESCROW_PENDING' &&
    toState === 'ESCROW_FUNDED'
  ) {
    const incidentKey =
      `treasury-review-required:${dossier.reference}`

    const incident =
      await prisma.activeIncident.upsert({
        where: {
          incidentKey,
        },
        create: {
          incidentKey,
          title: 'Treasury review required',
          detail:
            'Escrow funding has been confirmed. Treasury settlement review is required before export release.',
          severity: 'WARNING',
          streamType: 'DOSSIER',
          openedAt: new Date(),
          latestAt: new Date(),
          eventCount: 1,
        },
        update: {
          latestAt: new Date(),
          eventCount: {
            increment: 1,
          },
          resolved: false,
          resolvedAt: null,
          resolvedBy: null,
        },
      })

    return {
      ok: true,
      orchestration: {
        type: 'TREASURY_REVIEW_REQUIRED',
        incidentKey,
        incidentId: incident.id,
        dossierId: dossier.id,
        reference: dossier.reference,
        operatorEmail: principal.email,
      },
    }
  }

  if (
    fromState === 'ESCROW_FUNDED' &&
    toState === 'TREASURY_PENDING'
  ) {
    const approvalFromState = 'TREASURY_PENDING'
    const approvalToState = 'EXPORT_RELEASED'
    const transitionKey = getTransitionKey(
      approvalFromState,
      approvalToState
    )

    const requirements =
      await ensureDossierApprovalRequirements({
        dossierId: dossier.id,
        fromState: approvalFromState,
        toState: approvalToState,
      })

    return {
      ok: true,
      orchestration: {
        type: 'APPROVAL_REQUIREMENTS_CREATED',
        dossierId: dossier.id,
        reference: dossier.reference,
        transitionKey,
        requirementCount: requirements.length,
        operatorEmail: principal.email,
      },
    }
  }

  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    return {
      ok: true,
      orchestration: {
        type: 'EXPORT_RELEASE_AUTHORIZED',
        dossierId: dossier.id,
        reference: dossier.reference,
        operatorEmail: principal.email,
      },
    }
  }

  return {
    ok: true,
    orchestration: null,
  }
}