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

export function renderAnnexCRefineryTemplate(
  context: DossierTemplateContext
): DossierInstrumentRenderResult {
  const missingFields: DossierTemplateIssue[] = []
  const warnings: DossierTemplateIssue[] = []

  const buyer = context.parties.buyer
  const seller = context.parties.seller

  if (!hasValue(context.dossier.refinery)) {
    missingFields.push(
      missing(
        'dossier.refinery',
        'Refinery / receiving location',
        'Annex C requires a confirmed refinery or receiving location before external issuance.'
      )
    )
  }

  missingFields.push(
    missing(
      'refinery.intakeProtocol',
      'Refinery intake protocol',
      'Annex C requires refinery intake instructions, receiving procedure, or delivery intake protocol.'
    )
  )

  missingFields.push(
    missing(
      'refinery.assayProtocol',
      'Assay protocol',
      'Annex C requires assay procedure, testing authority, and assay confirmation terms.'
    )
  )

  missingFields.push(
    missing(
      'refinery.contact',
      'Refinery contact',
      'Annex C requires a refinery or receiving facility contact before external issuance.'
    )
  )

  if (!hasValue(context.dossier.commodity)) {
    missingFields.push(
      missing(
        'dossier.commodity',
        'Commodity',
        'Annex C requires commodity description for refinery intake.'
      )
    )
  }

  if (!hasValue(context.dossier.quantityKg)) {
    missingFields.push(
      missing(
        'dossier.quantityKg',
        'Quantity',
        'Annex C requires quantity context for refinery intake planning.'
      )
    )
  }

  if (!hasValue(context.dossier.origin)) {
    warnings.push(
      warning(
        'dossier.origin',
        'Origin',
        'Origin should be confirmed before refinery coordination is externally issued.'
      )
    )
  }

  if (!hasValue(buyer?.legalName)) {
    warnings.push(
      warning(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Buyer identity should be confirmed for refinery-side coordination.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    warnings.push(
      warning(
        'parties.seller.legalName',
        'Seller legal name',
        'Seller identity should be confirmed for refinery-side coordination.'
      )
    )
  }

  warnings.push(
    warning(
      'refinery.settlementDependency',
      'Settlement dependency',
      'Final settlement may depend on assay, refinery intake confirmation, and accepted purity/weight results. These dependencies are not yet modeled as structured fields.'
    )
  )

  warnings.push(
    warning(
      'refinery.chainOfCustody',
      'Chain of custody',
      'Chain of custody, custody transfer, and inspection responsibility are not yet modeled as structured fields.'
    )
  )

  const renderedText = [
    `ANNEX C · REFINERY COORDINATION DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Refinery / Receiving Overview`,
    `Refinery / Receiving Location: ${valueOrPlaceholder(context.dossier.refinery)}`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    ``,
    `2. Buyer / Seller Coordination Context`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    ``,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    ``,
    `3. Intake Protocol`,
    `Refinery intake instructions, receiving procedure, custody handoff, inspection process, and facility acceptance conditions are pending structured confirmation.`,
    ``,
    `4. Assay Protocol`,
    `Assay procedure, testing authority, purity confirmation, weight confirmation, dispute process, and final assay acceptance are pending structured confirmation.`,
    ``,
    `5. Settlement Dependency`,
    `Settlement may depend on refinery intake, assay confirmation, accepted purity, accepted weight, and final commercial reconciliation. These terms must be confirmed before external issuance.`,
    ``,
    `6. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex C refinery coordination preview. Refinery, intake, assay, and custody fields must be completed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_C_REFINERY',
    title: 'Annex C · Refinery Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
