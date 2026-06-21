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

export function renderAnnexDComplianceTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller

  if (!hasValue(buyer?.legalName)) {
    missingFields.push(
      missing(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Annex D requires buyer legal identity before compliance package can be externally issued.'
      )
    )
  }

  if (!hasValue(buyer?.representative)) {
    missingFields.push(
      missing(
        'parties.buyer.representative',
        'Buyer representative',
        'Annex D requires buyer representative identity or authorized contact.'
      )
    )
  }

  if (!hasValue(buyer?.country)) {
    missingFields.push(
      missing(
        'parties.buyer.country',
        'Buyer country',
        'Annex D requires buyer jurisdiction context for compliance review.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    missingFields.push(
      missing(
        'parties.seller.legalName',
        'Seller legal name',
        'Annex D requires seller legal identity before compliance package can be externally issued.'
      )
    )
  }

  if (!hasValue(seller?.representative)) {
    missingFields.push(
      missing(
        'parties.seller.representative',
        'Seller representative',
        'Annex D requires seller representative identity or authorized contact.'
      )
    )
  }

  if (!hasValue(seller?.country)) {
    missingFields.push(
      missing(
        'parties.seller.country',
        'Seller country',
        'Annex D requires seller jurisdiction context for compliance review.'
      )
    )
  }

  missingFields.push(
    missing(
      'compliance.buyerKycEvidence',
      'Buyer KYC evidence',
      'Annex D requires buyer KYC evidence, corporate profile, passport, or equivalent compliance material.'
    )
  )

  missingFields.push(
    missing(
      'compliance.sellerKycEvidence',
      'Seller KYC evidence',
      'Annex D requires seller KYC evidence, passport, corporate profile, cooperative authorization, or equivalent compliance material.'
    )
  )

  missingFields.push(
    missing(
      'compliance.authorityEvidence',
      'Authority / mandate evidence',
      'Annex D requires evidence that each representative is authorized to act for the represented party.'
    )
  )

  if (!hasValue(context.source.intakeReference)) {
    warnings.push(
      warning(
        'source.intakeReference',
        'Source intake reference',
        'No source intake reference is attached. Compliance traceability should be confirmed.'
      )
    )
  }

  if (!hasValue(context.source.submitterName)) {
    warnings.push(
      warning(
        'source.submitterName',
        'Submitter identity',
        'Submitter identity is not attached to the compliance trace.'
      )
    )
  }

  if (!hasValue(context.source.referralCode)) {
    warnings.push(
      warning(
        'source.referralCode',
        'Referral code',
        'No referral code is attached. This may be acceptable, but representative attribution should be confirmed.'
      )
    )
  }

  warnings.push(
    warning(
      'compliance.sanctionsScreening',
      'Sanctions / adverse media screening',
      'Sanctions, adverse media, and restricted-party screening are not yet modeled as structured fields.'
    )
  )

  warnings.push(
    warning(
      'compliance.documentVerification',
      'Document verification',
      'Uploaded identity and authority documents are not yet modeled as verifiable structured records.'
    )
  )

  const renderedText = [
    `ANNEX D · COMPLIANCE PACKAGE DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Compliance Purpose`,
    `This Annex D draft summarizes the identity, authority, KYC, and compliance-readiness context currently available for the transaction dossier.`,
    ``,
    `2. Buyer Compliance Profile`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    `Buyer KYC Evidence: [PENDING]`,
    `Buyer Authority / Mandate Evidence: [PENDING]`,
    ``,
    `3. Seller Compliance Profile`,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    `Seller KYC Evidence: [PENDING]`,
    `Seller Authority / Mandate Evidence: [PENDING]`,
    ``,
    `4. Product / Source Context`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Source Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Source Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    ``,
    `5. Traceability`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    `Submitter Email: ${valueOrPlaceholder(context.source.submitterEmail)}`,
    `Referral Code: ${valueOrPlaceholder(context.source.referralCode)}`,
    `Referred By: ${valueOrPlaceholder(context.source.referredByName)}`,
    ``,
    `6. Compliance Review Notes`,
    `Sanctions screening, adverse media checks, identity document review, authority confirmation, source verification, and supporting compliance artifacts remain pending structured confirmation.`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex D compliance preview. KYC, identity, authority, and compliance evidence must be completed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_D_COMPLIANCE',
    title: 'Annex D · Compliance Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
