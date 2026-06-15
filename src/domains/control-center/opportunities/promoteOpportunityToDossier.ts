import { prisma } from '@/lib/prisma'

import {
  createOpportunityEvent,
} from './createOpportunityEvent'

type Input = {
  opportunityId: string
  operatorEmail: string
}

type PromotionTransaction = Pick<
  typeof prisma,
  | 'transactionDossier'
  | 'opportunity'
  | 'transactionDossierEvent'
>

export type OpportunityPromotionResult = {
  opportunityId: string
  dossierId: string
  reference: string
  alreadyPromoted: boolean
}

function buildDossierReference() {
  const year = new Date().getFullYear()

  return `FWI-AU-OPP-${year}-${Date.now()}`
}

export async function promoteOpportunityToDossier({
  opportunityId,
  operatorEmail,
}: Input): Promise<OpportunityPromotionResult> {
  const opportunity =
    await prisma.opportunity.findUnique({
      where: {
        id: opportunityId,
      },
      include: {
        promotedDossier: true,
      },
    })

  if (!opportunity) {
    throw new Error('OPPORTUNITY_NOT_FOUND')
  }

  if (
    opportunity.promotedDossierId &&
    opportunity.promotedDossier
  ) {
    return {
      opportunityId: opportunity.id,
      dossierId: opportunity.promotedDossierId,
      reference:
        opportunity.promotedDossier.reference,
      alreadyPromoted: true,
    }
  }

  if (opportunity.promotedDossierId) {
    const promotedDossier =
      await prisma.transactionDossier.findUnique({
        where: {
          id: opportunity.promotedDossierId,
        },
      })

    if (promotedDossier) {
      return {
        opportunityId: opportunity.id,
        dossierId: promotedDossier.id,
        reference: promotedDossier.reference,
        alreadyPromoted: true,
      }
    }
  }

  if (
    opportunity.status !== 'APPROVED' &&
    opportunity.status !== 'UNDER_REVIEW' &&
    opportunity.status !== 'INTAKE'
  ) {
    throw new Error('OPPORTUNITY_NOT_PROMOTABLE')
  }

  const reference = buildDossierReference()

  const result =
    await prisma.$transaction(
      async (tx: PromotionTransaction) => {
        const latestOpportunity =
          await tx.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
            include: {
              promotedDossier: true,
            },
          })

        if (!latestOpportunity) {
          throw new Error('OPPORTUNITY_NOT_FOUND')
        }

        if (
          latestOpportunity.promotedDossierId &&
          latestOpportunity.promotedDossier
        ) {
          return {
            dossier: latestOpportunity.promotedDossier,
            alreadyPromoted: true,
          }
        }

        const dossier =
          await tx.transactionDossier.create({
            data: {
              reference,
              title: latestOpportunity.title,
              state: 'INTAKE_PENDING',
              commodity: latestOpportunity.commodity,
              origin: latestOpportunity.origin,
              quantityKg: latestOpportunity.quantityKg,
              settlement: null,
              refinery: null,
            },
          })

        await tx.opportunity.update({
          where: {
            id: latestOpportunity.id,
          },
          data: {
            status: 'PROMOTED',
            promotedDossierId: dossier.id,
            dossierId: dossier.id,
          },
        })

        await tx.transactionDossierEvent.create({
          data: {
            dossierId: dossier.id,
            eventType: 'DOSSIER_CREATED',
            fromState: null,
            toState: 'INTAKE_PENDING',
            message:
              'Dossier created from promoted opportunity.',
            actor: operatorEmail,
            metadata: {
              source: 'opportunity.promotion',
              opportunityId: latestOpportunity.id,
              opportunityTitle: latestOpportunity.title,
            },
          },
        })

        return {
          dossier,
          alreadyPromoted: false,
        }
      }
    )

  if (!result.alreadyPromoted) {
    await createOpportunityEvent({
      opportunityId: opportunity.id,
      type: 'OPPORTUNITY_PROMOTED',
      actor: operatorEmail,
      message:
        'Opportunity promoted into transaction dossier.',
      metadata: {
        source: 'opportunity.promotion',
        dossierId: result.dossier.id,
        reference: result.dossier.reference,
      },
    })
  }

  return {
    opportunityId: opportunity.id,
    dossierId: result.dossier.id,
    reference: result.dossier.reference,
    alreadyPromoted: result.alreadyPromoted,
  }
}
