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

function requireTerm(
  issues: DossierTemplateIssue[],
  value: string | null,
  field: string,
  label: string,
  detail: string
) {
  if (!hasValue(value)) {
    issues.push(
      missing(
        field,
        label,
        detail
      )
    )
  }
}

export function renderAnnexGCompensationScheduleTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller
  const terms = context.terms

  requireTerm(
    missingFields,
    terms.sellerSideCompensation,
    'terms.sellerSideCompensation',
    'Seller-side compensation amount',
    'Annex G requires the seller-side compensation amount, percentage, or allocation basis.'
  )

  requireTerm(
    missingFields,
    terms.buyerSideCompensation,
    'terms.buyerSideCompensation',
    'Buyer-side compensation amount',
    'Annex G requires the buyer-side compensation amount, percentage, or allocation basis.'
  )

  requireTerm(
    missingFields,
    terms.compensationPayees,
    'terms.compensationPayees',
    'Compensation payees / beneficiaries',
    'Annex G requires the payees, representatives, beneficiaries, or authorized recipient entities.'
  )

  requireTerm(
    missingFields,
    terms.compensationPayer,
    'terms.compensationPayer',
    'Compensation payer',
    'Annex G requires the party or account responsible for funding each compensation obligation.'
  )

  requireTerm(
    missingFields,
    terms.compensationPayoutTrigger,
    'terms.compensationPayoutTrigger',
    'Payout trigger',
    'Annex G requires the trigger for payout, such as successful settlement, refinery release, escrow release, MT103 confirmation, or another agreed event.'
  )

  requireTerm(
    missingFields,
    terms.compensationPaymentMethod,
    'terms.compensationPaymentMethod',
    'Payment method / coordinates',
    'Annex G requires the method of payment and approved payment coordinates for each compensation recipient.'
  )

  requireTerm(
    missingFields,
    terms.compensationAuthorizationStatus,
    'terms.compensationAuthorizationStatus',
    'Authorization / acknowledgement',
    'Annex G requires written authorization or acknowledgement by the responsible parties before external issuance.'
  )

  if (!hasValue(terms.settlementMethod ?? context.dossier.settlement)) {
    warnings.push(
      warning(
        'terms.settlementMethod',
        'Settlement method',
        'Settlement context should be confirmed because compensation timing depends on payment mechanics.'
      )
    )
  }

  if (!hasValue(buyer?.legalName)) {
    warnings.push(
      warning(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Buyer identity should be confirmed before compensation language is externally issued.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    warnings.push(
      warning(
        'parties.seller.legalName',
        'Seller legal name',
        'Seller identity should be confirmed before compensation language is externally issued.'
      )
    )
  }

  warnings.push(
    warning(
      'compensation.taxResponsibility',
      'Tax responsibility',
      'Tax responsibility, withholding, fees, and bank charges are not yet modeled as structured fields.'
    )
  )

  if (!hasValue(terms.compensationConfidentialityNote)) {
    warnings.push(
      warning(
        'terms.compensationConfidentialityNote',
        'Confidentiality / NCND alignment',
        'Compensation confidentiality, non-circumvention, and representative protection terms should be confirmed before external issuance.'
      )
    )
  }

  const renderedText = [
    `ANNEX G · COMPENSATION SCHEDULE DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Compensation Schedule Purpose`,
    `This Annex G draft summarizes the compensation structure, representative allocation, payout trigger, payment method, and authorization requirements currently available for the transaction dossier.`,
    ``,
    `2. Commercial Context`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Settlement Method: ${valueOrPlaceholder(terms.settlementMethod ?? context.dossier.settlement)}`,
    ``,
    `3. Compensation Allocation`,
    `Seller-Side Compensation: ${valueOrPlaceholder(terms.sellerSideCompensation)}`,
    `Buyer-Side Compensation: ${valueOrPlaceholder(terms.buyerSideCompensation)}`,
    `Payees / Beneficiaries: ${valueOrPlaceholder(terms.compensationPayees)}`,
    `Payer / Funding Party: ${valueOrPlaceholder(terms.compensationPayer)}`,
    `Payout Trigger: ${valueOrPlaceholder(terms.compensationPayoutTrigger)}`,
    `Payment Method / Coordinates: ${valueOrPlaceholder(terms.compensationPaymentMethod)}`,
    `Authorization Status: ${valueOrPlaceholder(terms.compensationAuthorizationStatus)}`,
    ``,
    `4. Parties`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    ``,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    ``,
    `5. Confidentiality and Representative Protection`,
    `Confidentiality / NCND Note: ${valueOrPlaceholder(terms.compensationConfidentialityNote)}`,
    `Tax responsibility, bank charges, and final payment timing remain subject to operator confirmation and applicable written authorization.`,
    ``,
    `6. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    `Referral Code: ${valueOrPlaceholder(context.source.referralCode)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex G compensation schedule preview. Compensation terms must be completed, authorized, and reviewed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_G_COMPENSATION_SCHEDULE',
    title: 'Annex G · Compensation Schedule Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
