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

export function renderAnnexADeliveryTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller

  if (!hasValue(context.dossier.commodity)) {
    missingFields.push(
      missing(
        'dossier.commodity',
        'Commodity',
        'Annex A requires a commodity description for delivery coordination.'
      )
    )
  }

  if (!hasValue(context.dossier.quantityKg)) {
    missingFields.push(
      missing(
        'dossier.quantityKg',
        'Quantity',
        'Annex A requires a confirmed quantity for movement planning.'
      )
    )
  }

  if (!hasValue(context.dossier.origin)) {
    missingFields.push(
      missing(
        'dossier.origin',
        'Origin',
        'Annex A requires origin context before delivery route can be considered complete.'
      )
    )
  }

  if (!hasValue(buyer?.legalName)) {
    missingFields.push(
      missing(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Annex A requires buyer identity context for delivery responsibility.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    missingFields.push(
      missing(
        'parties.seller.legalName',
        'Seller legal name',
        'Annex A requires seller identity context for delivery responsibility.'
      )
    )
  }

  if (!hasValue(context.dossier.refinery)) {
    warnings.push(
      warning(
        'dossier.refinery',
        'Receiving refinery / location',
        'No refinery or receiving location is attached. Delivery coordination should remain internal until receiving location is confirmed.'
      )
    )
  }

  if (!context.dossier.title.toUpperCase().includes('CIF')) {
    warnings.push(
      warning(
        'dossier.title',
        'Delivery structure',
        'Delivery structure was not clearly detected as CIF from the dossier title. Confirm whether this is CIF, FOB, cash and carry, or another structure.'
      )
    )
  }

  if (!context.dossier.title.toUpperCase().includes('LOS ANGELES')) {
    warnings.push(
      warning(
        'dossier.destination',
        'Destination',
        'Destination is not stored as a structured dossier field. Confirm destination before external issuance.'
      )
    )
  }

  const renderedText = [
    `ANNEX A · DELIVERY TERMS DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Delivery Overview`,
    `Delivery Structure: ${context.dossier.title.toUpperCase().includes('CIF') ? 'CIF' : '[PENDING CONFIRMATION]'}`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Destination / Receiving Location: ${valueOrPlaceholder(context.dossier.refinery)}`,
    ``,
    `2. Parties for Delivery Coordination`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    ``,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    ``,
    `3. Operational Notes`,
    `Seller-side delivery obligations, export coordination, logistics handling, inspection, refinery intake, and receiving protocols remain subject to final confirmation by the parties.`,
    ``,
    `4. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex A delivery preview. Missing fields and warnings must be resolved before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_A_DELIVERY',
    title: 'Annex A · Delivery Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
