import { prisma } from '@/lib/prisma'
import type {
  DossierTemplateBankCoordinate,
  DossierTemplateContext,
  DossierTemplateParty,
  DossierTemplateReleaseCondition,
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

function normalizeReleaseCondition(
  condition: {
    id: string
    title: string
    description: string | null
    trigger: string | null
    responsibleParty: string | null
    evidenceRequired: string | null
    status: string
    satisfiedBy: string | null
    satisfiedAt: Date | null
    notes: string | null
  }
): DossierTemplateReleaseCondition {
  return {
    id: condition.id,
    title: condition.title,
    description: condition.description,
    trigger: condition.trigger,
    responsibleParty: condition.responsibleParty,
    evidenceRequired: condition.evidenceRequired,
    status: condition.status,
    satisfiedBy: condition.satisfiedBy,
    satisfiedAt: condition.satisfiedAt?.toISOString() ?? null,
    notes: condition.notes,
  }
}

function normalizeBankCoordinate(
  coordinate: {
    id: string
    role: string
    label: string
    accountName: string | null
    bankName: string | null
    bankAddress: string | null
    accountNumber: string | null
    routingNumber: string | null
    swiftCode: string | null
    iban: string | null
    currency: string | null
    country: string | null
    notes: string | null
    verificationStatus: string
    verifiedBy: string | null
    verifiedAt: Date | null
  }
): DossierTemplateBankCoordinate {
  return {
    id: coordinate.id,
    role: coordinate.role,
    label: coordinate.label,
    accountName: coordinate.accountName,
    bankName: coordinate.bankName,
    bankAddress: coordinate.bankAddress,
    accountNumber: coordinate.accountNumber,
    routingNumber: coordinate.routingNumber,
    swiftCode: coordinate.swiftCode,
    iban: coordinate.iban,
    currency: coordinate.currency,
    country: coordinate.country,
    notes: coordinate.notes,
    verificationStatus: coordinate.verificationStatus,
    verifiedBy: coordinate.verifiedBy,
    verifiedAt: coordinate.verifiedAt?.toISOString() ?? null,
  }
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
        terms: true,
        bankCoordinates: true,
        releaseConditions: true,
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
  const bankCoordinates =
    dossier.bankCoordinates.map(normalizeBankCoordinate)
  const releaseConditions =
    dossier.releaseConditions.map(normalizeReleaseCondition)
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
    terms: {
      settlementMethod:
        dossier.terms?.settlementMethod ?? null,
      financialInstrumentType:
        dossier.terms?.financialInstrumentType ?? null,
      issuingInstitution:
        dossier.terms?.issuingInstitution ?? null,
      instrumentAmountOrCoverage:
        dossier.terms?.instrumentAmountOrCoverage ?? null,
      validityPeriod:
        dossier.terms?.validityPeriod ?? null,
      paymentTrigger:
        dossier.terms?.paymentTrigger ?? null,
      beneficiary:
        dossier.terms?.beneficiary ?? null,

      sellerSideCompensation:
        dossier.terms?.sellerSideCompensation ?? null,
      buyerSideCompensation:
        dossier.terms?.buyerSideCompensation ?? null,
      compensationPayer:
        dossier.terms?.compensationPayer ?? null,
      compensationPayees:
        dossier.terms?.compensationPayees ?? null,
      compensationPayoutTrigger:
        dossier.terms?.compensationPayoutTrigger ?? null,
      compensationPaymentMethod:
        dossier.terms?.compensationPaymentMethod ?? null,
      compensationAuthorizationStatus:
        dossier.terms?.compensationAuthorizationStatus ?? null,
      compensationConfidentialityNote:
        dossier.terms?.compensationConfidentialityNote ?? null,
    },
    bankCoordinates,
    releaseConditions,
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
