import type {
  DossierInstrumentRenderResult,
  DossierTemplateBankCoordinate,
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

function requireField(
  issues: DossierTemplateIssue[],
  value: string | null | undefined,
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

function findCoordinateByRole(
  coordinates: DossierTemplateBankCoordinate[],
  role: string
) {
  return (
    coordinates.find(
      (coordinate) => coordinate.role === role
    ) ?? null
  )
}

function coordinateSummary(
  coordinate: DossierTemplateBankCoordinate | null
) {
  if (!coordinate) {
    return '[PENDING STRUCTURED BANKING RECORD]'
  }

  return [
    coordinate.label,
    coordinate.accountName
      ? `Account: ${coordinate.accountName}`
      : null,
    coordinate.bankName
      ? `Bank: ${coordinate.bankName}`
      : null,
    coordinate.accountNumber
      ? `Account No: ${coordinate.accountNumber}`
      : null,
    coordinate.routingNumber
      ? `Routing: ${coordinate.routingNumber}`
      : null,
    coordinate.swiftCode
      ? `SWIFT: ${coordinate.swiftCode}`
      : null,
    coordinate.iban
      ? `IBAN: ${coordinate.iban}`
      : null,
    coordinate.currency
      ? `Currency: ${coordinate.currency}`
      : null,
    coordinate.country
      ? `Country: ${coordinate.country}`
      : null,
    `Verification: ${coordinate.verificationStatus}`,
  ]
    .filter(Boolean)
    .join(' | ')
}

function coordinateHasCoreFields(
  coordinate: DossierTemplateBankCoordinate | null
) {
  if (!coordinate) return false

  return Boolean(
    hasValue(coordinate.accountName) &&
    hasValue(coordinate.bankName) &&
    (
      hasValue(coordinate.accountNumber) ||
      hasValue(coordinate.iban)
    )
  )
}

function addCoordinateWarnings(
  warnings: DossierTemplateIssue[],
  coordinate: DossierTemplateBankCoordinate | null,
  fieldPrefix: string,
  label: string
) {
  if (!coordinate) return

  if (!coordinateHasCoreFields(coordinate)) {
    warnings.push(
      warning(
        `${fieldPrefix}.coreFields`,
        `${label} incomplete`,
        `${label} exists but is missing account name, bank name, account number, or IBAN.`
      )
    )
  }

  if (coordinate.verificationStatus !== 'VERIFIED') {
    warnings.push(
      warning(
        `${fieldPrefix}.verificationStatus`,
        `${label} not verified`,
        `${label} exists but verification status is ${coordinate.verificationStatus}.`
      )
    )
  }
}

export function renderAnnexBSettlementTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller
  const terms = context.terms

  const buyerCoordinate =
    findCoordinateByRole(
      context.bankCoordinates,
      'BUYER_REMITTING'
    )
  const sellerCoordinate =
    findCoordinateByRole(
      context.bankCoordinates,
      'SELLER_RECEIVING'
    )
  const escrowCoordinate =
    findCoordinateByRole(
      context.bankCoordinates,
      'ESCROW_TRUST'
    )

  const settlementMethod =
    terms.settlementMethod ?? context.dossier.settlement

  requireField(
    missingFields,
    settlementMethod,
    'terms.settlementMethod',
    'Settlement method',
    'Annex B requires a confirmed settlement method such as MT103, escrow, cash, DLC, SBLC, wire, or another approved mechanism.'
  )

  requireField(
    missingFields,
    buyer?.legalName,
    'parties.buyer.legalName',
    'Buyer legal name',
    'Annex B requires the buyer legal name before settlement instructions can be externally issued.'
  )

  requireField(
    missingFields,
    seller?.legalName,
    'parties.seller.legalName',
    'Seller legal name',
    'Annex B requires the seller legal name before settlement instructions can be externally issued.'
  )

  if (!buyerCoordinate) {
    missingFields.push(
      missing(
        'bankCoordinates.buyerRemitting',
        'Buyer banking coordinates',
        'Annex B requires a buyer remitting, issuing bank, escrow, or payment-source coordinate record before external issuance.'
      )
    )
  }

  if (!sellerCoordinate) {
    missingFields.push(
      missing(
        'bankCoordinates.sellerReceiving',
        'Seller banking coordinates',
        'Annex B requires a seller receiving, beneficiary, escrow, trust, or receiving account coordinate record before external issuance.'
      )
    )
  }

  addCoordinateWarnings(
    warnings,
    buyerCoordinate,
    'bankCoordinates.buyerRemitting',
    'Buyer banking coordinates'
  )

  addCoordinateWarnings(
    warnings,
    sellerCoordinate,
    'bankCoordinates.sellerReceiving',
    'Seller banking coordinates'
  )

  if (escrowCoordinate) {
    addCoordinateWarnings(
      warnings,
      escrowCoordinate,
      'bankCoordinates.escrowTrust',
      'Escrow / trust coordinates'
    )
  }

  if (!hasValue(terms.financialInstrumentType)) {
    warnings.push(
      warning(
        'terms.financialInstrumentType',
        'Financial instrument type',
        'Financial instrument type should be confirmed for settlement coordination.'
      )
    )
  }

  if (!hasValue(terms.issuingInstitution)) {
    warnings.push(
      warning(
        'terms.issuingInstitution',
        'Issuing / escrow institution',
        'Issuing bank, escrow institution, or settlement administrator should be confirmed.'
      )
    )
  }

  if (!hasValue(terms.paymentTrigger)) {
    warnings.push(
      warning(
        'terms.paymentTrigger',
        'Payment trigger',
        'Payment trigger or release condition should be confirmed before settlement instruction issuance.'
      )
    )
  }

  if (!hasValue(terms.beneficiary)) {
    warnings.push(
      warning(
        'terms.beneficiary',
        'Beneficiary / receiving party',
        'Beneficiary or receiving party should be confirmed before settlement instruction issuance.'
      )
    )
  }

  if (!hasValue(buyer?.representative)) {
    warnings.push(
      warning(
        'parties.buyer.representative',
        'Buyer representative',
        'Buyer representative is not fully structured.'
      )
    )
  }

  if (!hasValue(seller?.representative)) {
    warnings.push(
      warning(
        'parties.seller.representative',
        'Seller representative',
        'Seller representative is not fully structured.'
      )
    )
  }

  warnings.push(
    warning(
      'settlement.releaseConditions',
      'Release conditions',
      'Final release conditions, bank charges, compliance hold, and failed-payment handling are not yet modeled as structured fields.'
    )
  )

  const renderedText = [
    `ANNEX B · SETTLEMENT INSTRUCTIONS DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Settlement Purpose`,
    `This Annex B draft summarizes the settlement method, financial instrument context, beneficiary posture, banking coordinate status, and payment trigger currently available for the transaction dossier.`,
    ``,
    `2. Commercial Context`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Settlement Method: ${valueOrPlaceholder(settlementMethod)}`,
    ``,
    `3. Settlement Framework`,
    `Financial Instrument Type: ${valueOrPlaceholder(terms.financialInstrumentType)}`,
    `Issuing / Escrow Institution: ${valueOrPlaceholder(terms.issuingInstitution)}`,
    `Instrument Amount / Coverage Basis: ${valueOrPlaceholder(terms.instrumentAmountOrCoverage)}`,
    `Payment Trigger / Release Condition: ${valueOrPlaceholder(terms.paymentTrigger)}`,
    `Beneficiary / Receiving Party: ${valueOrPlaceholder(terms.beneficiary)}`,
    ``,
    `4. Banking Coordinates`,
    `Buyer Banking / Remitting Coordinates: ${coordinateSummary(buyerCoordinate)}`,
    `Seller Banking / Beneficiary Coordinates: ${coordinateSummary(sellerCoordinate)}`,
    `Escrow / Trust Coordinates: ${coordinateSummary(escrowCoordinate)}`,
    ``,
    `5. Parties`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    ``,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    ``,
    `6. Settlement Controls`,
    `Settlement remains subject to verified banking coordinates, compliance acceptance, release conditions, and operator authorization before external issuance.`,
    ``,
    `7. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    `Referral Code: ${valueOrPlaceholder(context.source.referralCode)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex B settlement preview. Settlement and banking instructions must be completed, verified, and reviewed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_B_SETTLEMENT',
    title: 'Annex B · Settlement Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
