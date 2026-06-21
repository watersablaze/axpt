import type {
  DossierInstrumentRenderResult,
  DossierTemplateContext,
  DossierTemplateIssue,
} from './types'

function missing(
  field: string,
  label: string,
  detail: string
): DossierTemplateIssue {
  return {
    field,
    label,
    status: 'MISSING',
    detail,
  }
}

function warning(
  field: string,
  label: string,
  detail: string
): DossierTemplateIssue {
  return {
    field,
    label,
    status: 'WARNING',
    detail,
  }
}

function valueOrPlaceholder(value: string | null | undefined) {
  return value && value.trim().length > 0
    ? value
    : '[PENDING]'
}

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0)
}

export function renderAnnexBSettlementTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller

  if (!hasValue(context.dossier.settlement)) {
    missingFields.push(
      missing(
        'dossier.settlement',
        'Settlement method',
        'Annex B requires a confirmed settlement method before external issuance.'
      )
    )
  }

  missingFields.push(
    missing(
      'settlement.buyerBankingCoordinates',
      'Buyer banking coordinates',
      'Annex B requires buyer-side banking or settlement pathway details before external issuance.'
    )
  )

  missingFields.push(
    missing(
      'settlement.sellerBankingCoordinates',
      'Seller banking coordinates',
      'Annex B requires seller-side receiving banking coordinates before external issuance.'
    )
  )

  if (!hasValue(buyer?.legalName)) {
    missingFields.push(
      missing(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Annex B requires buyer legal identity before settlement terms can be externally issued.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    missingFields.push(
      missing(
        'parties.seller.legalName',
        'Seller legal name',
        'Annex B requires seller legal identity before settlement terms can be externally issued.'
      )
    )
  }

  if (!hasValue(buyer?.representative)) {
    warnings.push(
      warning(
        'parties.buyer.representative',
        'Buyer representative',
        'Buyer representative should be confirmed before settlement coordination.'
      )
    )
  }

  if (!hasValue(seller?.representative)) {
    warnings.push(
      warning(
        'parties.seller.representative',
        'Seller representative',
        'Seller representative should be confirmed before settlement coordination.'
      )
    )
  }

  warnings.push(
    warning(
      'settlement.releaseConditions',
      'Release conditions',
      'Settlement release conditions are not yet modeled as structured fields. Confirm release triggers before external issuance.'
    )
  )

  warnings.push(
    warning(
      'settlement.commissionInstructions',
      'Commission instructions',
      'Commission or representative compensation instructions are not yet modeled in the settlement context.'
    )
  )

  const renderedText = [
    `ANNEX B · SETTLEMENT TERMS DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Settlement Overview`,
    `Settlement Method: ${valueOrPlaceholder(context.dossier.settlement)}`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    ``,
    `2. Buyer Settlement Party`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    `Buyer Banking Coordinates: [PENDING]`,
    ``,
    `3. Seller Settlement Party`,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    `Seller Banking Coordinates: [PENDING]`,
    ``,
    `4. Release Conditions`,
    `Funds release, escrow movement, banking confirmation, tax/export payment handling, and final settlement triggers remain pending structured confirmation.`,
    ``,
    `5. Commission / Representative Instructions`,
    `Commission or representative compensation instructions are pending structured confirmation and should not be inferred from this draft.`,
    ``,
    `6. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex B settlement preview. Settlement and banking fields must be completed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_B_SETTLEMENT',
    title: 'Annex B · Settlement Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
