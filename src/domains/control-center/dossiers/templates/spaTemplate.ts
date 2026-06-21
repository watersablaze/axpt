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

export function renderSpaTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller

  if (!buyer?.legalName) {
    missingFields.push(
      missing(
        'parties.buyer.legalName',
        'Buyer legal name',
        'SPA requires a buyer legal name before it can be treated as complete.'
      )
    )
  }

  if (!seller?.legalName) {
    missingFields.push(
      missing(
        'parties.seller.legalName',
        'Seller legal name',
        'SPA requires a seller legal name before it can be treated as complete.'
      )
    )
  }

  if (!context.dossier.commodity) {
    missingFields.push(
      missing(
        'dossier.commodity',
        'Commodity',
        'SPA requires a commodity description.'
      )
    )
  }

  if (!context.dossier.quantityKg) {
    missingFields.push(
      missing(
        'dossier.quantityKg',
        'Quantity',
        'SPA requires a quantity value.'
      )
    )
  }

  if (!context.dossier.origin) {
    missingFields.push(
      missing(
        'dossier.origin',
        'Origin',
        'SPA requires origin context.'
      )
    )
  }

  if (!context.dossier.settlement) {
    warnings.push(
      warning(
        'dossier.settlement',
        'Settlement method',
        'Settlement method is not yet confirmed. Draft should remain internal until settlement terms are completed.'
      )
    )
  }

  if (!context.dossier.refinery) {
    warnings.push(
      warning(
        'dossier.refinery',
        'Refinery coordination',
        'Refinery is not yet attached. Annex C should remain pending until refinery details are confirmed.'
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
