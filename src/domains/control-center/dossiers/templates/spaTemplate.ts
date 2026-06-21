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

export function renderSpaTemplate(
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
        'SPA requires a buyer legal name before it can be treated as complete.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    missingFields.push(
      missing(
        'parties.seller.legalName',
        'Seller legal name',
        'SPA requires a seller legal name before it can be treated as complete.'
      )
    )
  }

  if (!hasValue(seller?.representative)) {
    missingFields.push(
      missing(
        'parties.seller.representative',
        'Seller representative',
        'SPA requires a seller-side representative or authorized contact before external issuance.'
      )
    )
  }

  if (!hasValue(seller?.country)) {
    missingFields.push(
      missing(
        'parties.seller.country',
        'Seller country',
        'SPA requires seller country context for party identification and compliance review.'
      )
    )
  }

  if (!hasValue(context.dossier.commodity)) {
    missingFields.push(
      missing(
        'dossier.commodity',
        'Commodity',
        'SPA requires a commodity description.'
      )
    )
  }

  if (!hasValue(context.dossier.quantityKg)) {
    missingFields.push(
      missing(
        'dossier.quantityKg',
        'Quantity',
        'SPA requires a quantity value.'
      )
    )
  }

  if (!hasValue(context.dossier.origin)) {
    missingFields.push(
      missing(
        'dossier.origin',
        'Origin',
        'SPA requires origin context.'
      )
    )
  }

  if (!hasValue(context.dossier.settlement)) {
    missingFields.push(
      missing(
        'dossier.settlement',
        'Settlement method',
        'SPA requires confirmed settlement terms before it can be externally issued.'
      )
    )
  }

  if (!hasValue(buyer?.representative)) {
    warnings.push(
      warning(
        'parties.buyer.representative',
        'Buyer representative',
        'Buyer representative is not confirmed. Draft can remain internal, but KYC review should confirm authority.'
      )
    )
  }

  if (!hasValue(buyer?.country)) {
    warnings.push(
      warning(
        'parties.buyer.country',
        'Buyer country',
        'Buyer country is not confirmed. Compliance review should confirm jurisdiction.'
      )
    )
  }

  if (!hasValue(context.dossier.refinery)) {
    warnings.push(
      warning(
        'dossier.refinery',
        'Refinery coordination',
        'Refinery is not yet attached. Annex C should remain pending until refinery details are confirmed.'
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

  if (
    hasValue(seller?.legalName) &&
    (!hasValue(seller?.representative) ||
      !hasValue(seller?.country))
  ) {
    warnings.push(
      warning(
        'parties.seller',
        'Seller identity context incomplete',
        'Seller legal name is present, but representative or country context is incomplete. Treat seller side as seeded until enriched.'
      )
    )
  }

  const renderedText = [
    `SALE AND PURCHASE AGREEMENT DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Parties`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    ``,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    ``,
    `2. Commercial Terms`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Settlement: ${valueOrPlaceholder(context.dossier.settlement)}`,
    `Refinery: ${valueOrPlaceholder(context.dossier.refinery)}`,
    ``,
    `3. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Referral Code: ${valueOrPlaceholder(context.source.referralCode)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal draft preview. Missing fields and warnings must be resolved before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'SPA',
    title: 'SPA Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
