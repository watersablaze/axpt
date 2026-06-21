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

export function renderAnnexFFinancialInstrumentTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller
  const terms = context.terms

  requireTerm(
    missingFields,
    terms.financialInstrumentType,
    'terms.financialInstrumentType',
    'Financial instrument type',
    'Annex F requires a confirmed instrument type such as DLC, SBLC, MT103, escrow, wire, or another approved mechanism.'
  )

  requireTerm(
    missingFields,
    terms.issuingInstitution,
    'terms.issuingInstitution',
    'Issuing financial institution',
    'Annex F requires the issuing bank, escrow institution, or financial institution responsible for the instrument.'
  )

  requireTerm(
    missingFields,
    terms.instrumentAmountOrCoverage,
    'terms.instrumentAmountOrCoverage',
    'Instrument amount / coverage basis',
    'Annex F requires the instrument amount, coverage basis, tranche amount, or settlement coverage rule.'
  )

  requireTerm(
    missingFields,
    terms.validityPeriod,
    'terms.validityPeriod',
    'Validity period / tenor',
    'Annex F requires the instrument validity period, tenor, or expiry framework.'
  )

  requireTerm(
    missingFields,
    terms.paymentTrigger,
    'terms.paymentTrigger',
    'Payment trigger / draw condition',
    'Annex F requires the payment trigger, draw condition, release instruction, or settlement activation rule.'
  )

  requireTerm(
    missingFields,
    terms.beneficiary,
    'terms.beneficiary',
    'Beneficiary / receiving party',
    'Annex F requires the beneficiary, escrow recipient, seller receiver, or designated receiving party.'
  )

  requireTerm(
    missingFields,
    terms.settlementMethod,
    'terms.settlementMethod',
    'Settlement method',
    'Annex F requires settlement method context before the financial instrument framework can be externally issued.'
  )

  if (!hasValue(buyer?.legalName)) {
    warnings.push(
      warning(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Buyer identity should be confirmed before financial instrument coordination.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    warnings.push(
      warning(
        'parties.seller.legalName',
        'Seller legal name',
        'Seller identity should be confirmed before financial instrument coordination.'
      )
    )
  }

  warnings.push(
    warning(
      'settlement.bankingCoordinates',
      'Banking coordinates',
      'Buyer, seller, escrow, or receiving banking coordinates are not yet modeled as structured fields.'
    )
  )

  warnings.push(
    warning(
      'financialInstrument.bankCompliance',
      'Bank compliance review',
      'Bank compliance, instrument format approval, and issuing institution acceptance are not yet modeled as structured fields.'
    )
  )

  warnings.push(
    warning(
      'financialInstrument.amendmentRules',
      'Amendment / extension rules',
      'Instrument amendment, extension, expiry, and rejection procedures are not yet modeled as structured fields.'
    )
  )

  const renderedText = [
    `ANNEX F · FINANCIAL INSTRUMENT FRAMEWORK DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Financial Instrument Purpose`,
    `This Annex F draft summarizes the financial instrument framework, settlement mechanism, coverage basis, and payment control structure currently available for the transaction dossier.`,
    ``,
    `2. Commercial Context`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Settlement Method: ${valueOrPlaceholder(terms.settlementMethod ?? context.dossier.settlement)}`,
    ``,
    `3. Instrument Framework`,
    `Instrument Type: ${valueOrPlaceholder(terms.financialInstrumentType)}`,
    `Issuing Institution: ${valueOrPlaceholder(terms.issuingInstitution)}`,
    `Amount / Coverage Basis: ${valueOrPlaceholder(terms.instrumentAmountOrCoverage)}`,
    `Validity Period / Tenor: ${valueOrPlaceholder(terms.validityPeriod)}`,
    `Payment Trigger / Draw Condition: ${valueOrPlaceholder(terms.paymentTrigger)}`,
    `Beneficiary / Receiving Party: ${valueOrPlaceholder(terms.beneficiary)}`,
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
    `5. Control Notes`,
    `Instrument issuance, bank compliance review, amendment rules, expiry rules, draw conditions, and release controls remain subject to operator confirmation and compliance review.`,
    ``,
    `6. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex F financial instrument preview. Financial instrument terms must be completed and reviewed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_F_FINANCIAL_INSTRUMENT',
    title: 'Annex F · Financial Instrument Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
