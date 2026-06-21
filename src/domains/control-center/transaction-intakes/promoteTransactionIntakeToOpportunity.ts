import { prisma } from '@/lib/prisma'

import type {
  OpportunitySource,
} from '@/domains/control-center/opportunities/types'

type PromoteTransactionIntakeInput = {
  intakeId: string
  actorEmail?: string | null
}

type PromotedOpportunityResult = {
  intakeId: string
  intakeReference: string
  opportunityId: string
  opportunityTitle: string
  alreadyPromoted: boolean
}

function clean(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

function firstClean(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const cleaned = clean(value)

    if (cleaned) return cleaned
  }

  return null
}

function determineOpportunitySource(input: {
  referralCode: string | null
  referredByName: string | null
  sourceUrl: string | null
  transactionType: string | null
}): OpportunitySource {
  if (
    clean(input.referralCode) ||
    clean(input.referredByName)
  ) {
    return 'REFERRAL'
  }

  if (clean(input.sourceUrl)) {
    return 'WEBSITE'
  }

  const transactionType =
    clean(input.transactionType)?.toUpperCase() ?? ''

  if (transactionType.includes('LOI')) {
    return 'LOI'
  }

  return 'INTERNAL'
}

function buildOpportunityTitle(input: {
  reference: string
  program: string | null
  commodity: string | null
  quantity: string | null
  transactionType: string | null
  destination: string | null
}) {
  const parts = [
    clean(input.program),
    clean(input.commodity),
    clean(input.quantity),
    clean(input.transactionType),
    clean(input.destination),
  ].filter(Boolean)

  if (parts.length > 0) {
    return parts.join(' · ')
  }

  return `Transaction Intake ${input.reference}`
}

function buildOpportunityNotes(input: {
  reference: string
  submitterName: string
  submitterEmail: string
  submitterCompany: string | null
  submitterRole: string
  representedPartyType: string | null
  representedPartyName: string | null
  authorizationStatus: string | null
  program: string | null
  transactionType: string | null
  deliveryTerms: string | null
  settlementMethod: string | null
  expectedTimeline: string | null
  financialReadiness: string | null
  documentsAvailable: string | null
  refineryPreference: string | null
  referralCode: string | null
  referredByName: string | null
  referredByCompany: string | null
  referredByEmail: string | null
  referredByPhone: string | null
  referredByRole: string | null
  referralConfirmed: boolean
  compensationExpectation: string | null
  supportingNotes: string | null
  sourceUrl: string | null
}) {
  const lines = [
    `Transaction Intake: ${input.reference}`,
    `Submitter: ${input.submitterName} <${input.submitterEmail}>`,
    clean(input.submitterCompany)
      ? `Company: ${input.submitterCompany}`
      : null,
    `Submitter Role: ${input.submitterRole}`,
    clean(input.representedPartyType) ||
    clean(input.representedPartyName)
      ? `Representation: ${[
          input.representedPartyType,
          input.representedPartyName,
        ]
          .map(clean)
          .filter(Boolean)
          .join(' · ')}`
      : null,
    clean(input.authorizationStatus)
      ? `Authorization: ${input.authorizationStatus}`
      : null,
    clean(input.program)
      ? `Program: ${input.program}`
      : null,
    clean(input.transactionType)
      ? `Transaction Type: ${input.transactionType}`
      : null,
    clean(input.deliveryTerms)
      ? `Delivery Terms: ${input.deliveryTerms}`
      : null,
    clean(input.settlementMethod)
      ? `Settlement Method: ${input.settlementMethod}`
      : null,
    clean(input.expectedTimeline)
      ? `Expected Timeline: ${input.expectedTimeline}`
      : null,
    clean(input.financialReadiness)
      ? `Financial Readiness: ${input.financialReadiness}`
      : null,
    clean(input.documentsAvailable)
      ? `Documents Available: ${input.documentsAvailable}`
      : null,
    clean(input.refineryPreference)
      ? `Refinery Preference: ${input.refineryPreference}`
      : null,
    clean(input.referralCode) ||
    clean(input.referredByName)
      ? `Referral: ${[
          input.referralCode,
          input.referredByName,
          input.referredByCompany,
          input.referredByRole,
        ]
          .map(clean)
          .filter(Boolean)
          .join(' · ')}`
      : null,
    clean(input.referredByEmail)
      ? `Referral Email: ${input.referredByEmail}`
      : null,
    clean(input.referredByPhone)
      ? `Referral Phone: ${input.referredByPhone}`
      : null,
    `Referral Confirmed: ${
      input.referralConfirmed ? 'Yes' : 'No'
    }`,
    clean(input.compensationExpectation)
      ? `Compensation Expectation: ${input.compensationExpectation}`
      : null,
    clean(input.sourceUrl)
      ? `Source URL: ${input.sourceUrl}`
      : null,
    clean(input.supportingNotes)
      ? `Supporting Notes: ${input.supportingNotes}`
      : null,
  ].filter(Boolean)

  return lines.join('\n')
}

export async function promoteTransactionIntakeToOpportunity({
  intakeId,
  actorEmail,
}: PromoteTransactionIntakeInput): Promise<PromotedOpportunityResult> {
  return prisma.$transaction(async (tx: typeof prisma) => {
    const intake =
      await tx.transactionIntake.findUnique({
        where: {
          id: intakeId,
        },
        include: {
          promotedOpportunity: true,
        },
      })

    if (!intake) {
      throw new Error('TRANSACTION_INTAKE_NOT_FOUND')
    }

    if (intake.promotedOpportunityId) {
      if (!intake.promotedOpportunity) {
        throw new Error('PROMOTED_OPPORTUNITY_NOT_FOUND')
      }

      return {
        intakeId: intake.id,
        intakeReference: intake.reference,
        opportunityId: intake.promotedOpportunity.id,
        opportunityTitle: intake.promotedOpportunity.title,
        alreadyPromoted: true,
      }
    }

    if (intake.status !== 'QUALIFIED') {
      throw new Error('TRANSACTION_INTAKE_NOT_QUALIFIED')
    }

    const representedPartyType =
      clean(intake.representedPartyType)?.toUpperCase() ??
      null

    const buyerName =
      representedPartyType === 'BUYER'
        ? firstClean(
            intake.representedPartyName,
            intake.buyerName
          )
        : clean(intake.buyerName)

    const sellerName =
      representedPartyType === 'SELLER'
        ? firstClean(
            intake.representedPartyName,
            intake.sellerName
          )
        : clean(intake.sellerName)

    const quantityKg =
      firstClean(
        intake.quantity,
        intake.trialQuantity,
        intake.monthlyQuantity
      )

    const title =
      buildOpportunityTitle({
        reference: intake.reference,
        program: intake.program,
        commodity: intake.commodity,
        quantity: quantityKg,
        transactionType: intake.transactionType,
        destination: intake.destination,
      })

    const source =
      determineOpportunitySource({
        referralCode: intake.referralCode,
        referredByName: intake.referredByName,
        sourceUrl: intake.sourceUrl,
        transactionType: intake.transactionType,
      })

    const opportunity =
      await tx.opportunity.create({
        data: {
          title,
          source,
          status: 'INTAKE',
          commodity: clean(intake.commodity),
          buyerName,
          sellerName,
          origin: clean(intake.origin),
          destination: clean(intake.destination),
          quantityKg,
          notes: buildOpportunityNotes({
            reference: intake.reference,
            submitterName: intake.submitterName,
            submitterEmail: intake.submitterEmail,
            submitterCompany: intake.submitterCompany,
            submitterRole: intake.submitterRole,
            representedPartyType: intake.representedPartyType,
            representedPartyName: intake.representedPartyName,
            authorizationStatus: intake.authorizationStatus,
            program: intake.program,
            transactionType: intake.transactionType,
            deliveryTerms: intake.deliveryTerms,
            settlementMethod: intake.settlementMethod,
            expectedTimeline: intake.expectedTimeline,
            financialReadiness: intake.financialReadiness,
            documentsAvailable: intake.documentsAvailable,
            refineryPreference: intake.refineryPreference,
            referralCode: intake.referralCode,
            referredByName: intake.referredByName,
            referredByCompany: intake.referredByCompany,
            referredByEmail: intake.referredByEmail,
            referredByPhone: intake.referredByPhone,
            referredByRole: intake.referredByRole,
            referralConfirmed: intake.referralConfirmed,
            compensationExpectation:
              intake.compensationExpectation,
            supportingNotes: intake.supportingNotes,
            sourceUrl: intake.sourceUrl,
          }),
        },
      })

    await tx.opportunityEvent.create({
      data: {
        opportunityId: opportunity.id,
        type: 'OPPORTUNITY_CREATED',
        actor: actorEmail ?? null,
        message:
          'Opportunity promoted from transaction intake.',
        metadata: {
          source: 'transaction-intake.promotion',
          intakeId: intake.id,
          intakeReference: intake.reference,
          intakeStatus: intake.status,
          opportunitySource: source,
        },
      },
    })

    await tx.transactionIntake.update({
      where: {
        id: intake.id,
      },
      data: {
        status: 'PROMOTED_TO_OPPORTUNITY',
        promotedOpportunityId: opportunity.id,
        promotedAt: new Date(),
        promotedBy: actorEmail ?? null,
      },
    })

    await tx.transactionIntakeEvent.create({
      data: {
        intakeId: intake.id,
        eventType: 'PROMOTED_TO_OPPORTUNITY',
        fromStatus: intake.status,
        toStatus: 'PROMOTED_TO_OPPORTUNITY',
        actor: actorEmail ?? null,
        note: `Promoted to opportunity ${opportunity.title}.`,
      },
    })

    return {
      intakeId: intake.id,
      intakeReference: intake.reference,
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      alreadyPromoted: false,
    }
  })
}
