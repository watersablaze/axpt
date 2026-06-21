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

type DossierPartySeed = {
  role: 'BUYER' | 'SELLER'
  legalName: string
  representative?: string | null
  country?: string | null
  notes?: string | null
}

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

function normalizeQuantityKg(
  value: string | null
): string | null {
  if (!value) return null

  const normalized = value
    .trim()
    .replace(/kg/gi, '')
    .replace(/,/g, '')
    .trim()

  if (!normalized) return null

  const numericValue = Number(normalized)

  if (!Number.isFinite(numericValue)) {
    throw new Error('OPPORTUNITY_QUANTITY_INVALID')
  }

  return normalized
}

function clean(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildPartySeeds(input: {
  buyerName: string | null
  sellerName: string | null
  sourceIntake?: {
    submitterName: string
    submitterEmail: string
    representedPartyType: string | null
    representedPartyName: string | null
    submitterCountry: string | null
    referredByName: string | null
    referredByCompany: string | null
    referralCode: string | null
  } | null
}): DossierPartySeed[] {
  const parties: DossierPartySeed[] = []

  const representedPartyType =
    clean(
      input.sourceIntake?.representedPartyType
    )?.toUpperCase() ?? null

  const representedPartyName =
    clean(input.sourceIntake?.representedPartyName)

  const buyerName =
    representedPartyType === 'BUYER'
      ? representedPartyName ?? clean(input.buyerName)
      : clean(input.buyerName)

  const sellerName =
    representedPartyType === 'SELLER'
      ? representedPartyName ?? clean(input.sellerName)
      : clean(input.sellerName)

  if (buyerName) {
    parties.push({
      role: 'BUYER',
      legalName: buyerName,
      representative:
        representedPartyType === 'BUYER'
          ? clean(input.sourceIntake?.submitterName)
          : null,
      country:
        representedPartyType === 'BUYER'
          ? clean(input.sourceIntake?.submitterCountry)
          : null,
      notes:
        representedPartyType === 'BUYER'
          ? `Seeded from source intake. Submitter: ${input.sourceIntake?.submitterName} <${input.sourceIntake?.submitterEmail}>.`
          : 'Seeded from promoted opportunity buyer field.',
    })
  }

  if (sellerName) {
    parties.push({
      role: 'SELLER',
      legalName: sellerName,
      representative:
        representedPartyType === 'SELLER'
          ? clean(input.sourceIntake?.submitterName)
          : null,
      country:
        representedPartyType === 'SELLER'
          ? clean(input.sourceIntake?.submitterCountry)
          : null,
      notes:
        representedPartyType === 'SELLER'
          ? `Seeded from source intake. Submitter: ${input.sourceIntake?.submitterName} <${input.sourceIntake?.submitterEmail}>.`
          : 'Seeded from promoted opportunity seller field.',
    })
  }

  return parties
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
              sourceTransactionIntake: {
                select: {
                  id: true,
                  reference: true,
                  submitterName: true,
                  submitterEmail: true,
                  submitterCountry: true,
                  representedPartyType: true,
                  representedPartyName: true,
                  referralCode: true,
                  referredByName: true,
                  referredByCompany: true,
                },
              },
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

        const quantityKg = normalizeQuantityKg(
          latestOpportunity.quantityKg
        )

        const partySeeds = buildPartySeeds({
          buyerName: latestOpportunity.buyerName,
          sellerName: latestOpportunity.sellerName,
          sourceIntake:
            latestOpportunity.sourceTransactionIntake,
        })

        const dossier =
          await tx.transactionDossier.create({
            data: {
              reference,
              title: latestOpportunity.title,
              state: 'INTAKE_PENDING',
              commodity: latestOpportunity.commodity,
              origin: latestOpportunity.origin,
              quantityKg,
              settlement: null,
              refinery: null,
              parties:
                partySeeds.length > 0
                  ? {
                      create: partySeeds,
                    }
                  : undefined,
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
              seededPartyCount: partySeeds.length,
              sourceIntakeId:
                latestOpportunity.sourceTransactionIntake?.id ??
                null,
              sourceIntakeReference:
                latestOpportunity.sourceTransactionIntake
                  ?.reference ?? null,
              referralCode:
                latestOpportunity.sourceTransactionIntake
                  ?.referralCode ?? null,
              referredByName:
                latestOpportunity.sourceTransactionIntake
                  ?.referredByName ?? null,
            },
          },
        })

        if (partySeeds.length > 0) {
          await tx.transactionDossierEvent.create({
            data: {
              dossierId: dossier.id,
              eventType: 'DOSSIER_PARTIES_SEEDED',
              fromState: null,
              toState: 'INTAKE_PENDING',
              message:
                'Initial dossier parties seeded from promoted opportunity.',
              actor: operatorEmail,
              metadata: {
                source: 'opportunity.promotion',
                opportunityId: latestOpportunity.id,
                seededParties: partySeeds.map((party) => ({
                  role: party.role,
                  legalName: party.legalName,
                })),
              },
            },
          })
        }

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
