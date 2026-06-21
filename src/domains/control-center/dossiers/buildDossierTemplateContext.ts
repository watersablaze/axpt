import { prisma } from '@/lib/prisma'
import type {
  DossierTemplateContext,
  DossierTemplateParty,
} from './templates/types'

function normalizeParty(
  party: {
    role: string
    legalName: string
    representative: string | null
    country: string | null
    notes: string | null
  }
): DossierTemplateParty {
  return {
    role: party.role,
    legalName: party.legalName,
    representative: party.representative,
    country: party.country,
    notes: party.notes,
  }
}

function findPartyByRole(
  parties: DossierTemplateParty[],
  role: string
) {
  return (
    parties.find((party) => party.role === role) ?? null
  )
}

export async function buildDossierTemplateContext(
  dossierId: string
): Promise<DossierTemplateContext> {
  const dossier =
    await prisma.transactionDossier.findUnique({
      where: {
        id: dossierId,
      },
      include: {
        parties: true,
        promotedOpportunities: {
          take: 1,
          include: {
            sourceTransactionIntake: {
              select: {
                reference: true,
                referralCode: true,
                referredByName: true,
                submitterName: true,
                submitterEmail: true,
              },
            },
          },
        },
      },
    })

  if (!dossier) {
    throw new Error('DOSSIER_NOT_FOUND')
  }

  const parties = dossier.parties.map(normalizeParty)
  const sourceOpportunity =
    dossier.promotedOpportunities[0] ?? null
  const sourceIntake =
    sourceOpportunity?.sourceTransactionIntake ?? null

  return {
    dossier: {
      id: dossier.id,
      reference: dossier.reference,
      title: dossier.title,
      state: dossier.state,
      commodity: dossier.commodity,
      origin: dossier.origin,
      quantityKg: dossier.quantityKg?.toString() ?? null,
      refinery: dossier.refinery,
      settlement: dossier.settlement,
    },
    parties: {
      buyer: findPartyByRole(parties, 'BUYER'),
      seller: findPartyByRole(parties, 'SELLER'),
      all: parties,
    },
    source: {
      opportunityTitle: sourceOpportunity?.title ?? null,
      intakeReference: sourceIntake?.reference ?? null,
      referralCode: sourceIntake?.referralCode ?? null,
      referredByName: sourceIntake?.referredByName ?? null,
      submitterName: sourceIntake?.submitterName ?? null,
      submitterEmail: sourceIntake?.submitterEmail ?? null,
    },
  }
}
