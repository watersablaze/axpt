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

export function renderAnnexEProcedureTemplate(
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
        'Annex E requires a confirmed settlement method before external issuance.'
      )
    )
  }

  if (!hasValue(context.dossier.refinery)) {
    missingFields.push(
      missing(
        'dossier.refinery',
        'Refinery / receiving location',
        'Annex E requires the receiving refinery or location before execution procedure can be externally issued.'
      )
    )
  }

  missingFields.push(
    missing(
      'execution.stepSequence',
      'Execution step sequence',
      'Annex E requires a confirmed step-by-step transaction procedure before external issuance.'
    )
  )

  missingFields.push(
    missing(
      'execution.releaseConditions',
      'Release conditions',
      'Annex E requires confirmed release triggers for documents, shipment, settlement, or export activation.'
    )
  )

  missingFields.push(
    missing(
      'execution.operatorResponsibilities',
      'Operator responsibilities',
      'Annex E requires assigned responsibilities for buyer, seller, escrow, refinery, logistics, and coordination roles.'
    )
  )

  if (!hasValue(buyer?.legalName)) {
    missingFields.push(
      missing(
        'parties.buyer.legalName',
        'Buyer legal name',
        'Annex E requires buyer identity before execution procedure can be externally issued.'
      )
    )
  }

  if (!hasValue(seller?.legalName)) {
    missingFields.push(
      missing(
        'parties.seller.legalName',
        'Seller legal name',
        'Annex E requires seller identity before execution procedure can be externally issued.'
      )
    )
  }

  if (!hasValue(buyer?.representative)) {
    warnings.push(
      warning(
        'parties.buyer.representative',
        'Buyer representative',
        'Buyer representative should be confirmed before execution coordination.'
      )
    )
  }

  if (!hasValue(seller?.representative)) {
    warnings.push(
      warning(
        'parties.seller.representative',
        'Seller representative',
        'Seller representative should be confirmed before execution coordination.'
      )
    )
  }

  warnings.push(
    warning(
      'execution.timeline',
      'Execution timeline',
      'Execution dates, shipment windows, document release timing, and expected milestone timing are not yet modeled as structured fields.'
    )
  )

  warnings.push(
    warning(
      'execution.exceptionHandling',
      'Exception handling',
      'Blocked, cancelled, failed-assay, delayed-shipment, and settlement-dispute procedures are not yet modeled as structured fields.'
    )
  )

  const renderedText = [
    `ANNEX E · EXECUTION FRAMEWORK DRAFT`,
    ``,
    `Reference: ${context.dossier.reference}`,
    `Dossier: ${context.dossier.title}`,
    `Current State: ${context.dossier.state}`,
    ``,
    `1. Execution Purpose`,
    `This Annex E draft outlines the procedural framework for moving the transaction from dossier readiness through document activation, settlement preparation, export coordination, refinery intake, assay confirmation, and final settlement.`,
    ``,
    `2. Commercial Context`,
    `Commodity: ${valueOrPlaceholder(context.dossier.commodity)}`,
    `Quantity: ${valueOrPlaceholder(context.dossier.quantityKg)} KG`,
    `Origin: ${valueOrPlaceholder(context.dossier.origin)}`,
    `Settlement Method: ${valueOrPlaceholder(context.dossier.settlement)}`,
    `Refinery / Receiving Location: ${valueOrPlaceholder(context.dossier.refinery)}`,
    ``,
    `3. Parties`,
    `Buyer: ${valueOrPlaceholder(buyer?.legalName)}`,
    `Buyer Representative: ${valueOrPlaceholder(buyer?.representative)}`,
    `Buyer Country: ${valueOrPlaceholder(buyer?.country)}`,
    ``,
    `Seller: ${valueOrPlaceholder(seller?.legalName)}`,
    `Seller Representative: ${valueOrPlaceholder(seller?.representative)}`,
    `Seller Country: ${valueOrPlaceholder(seller?.country)}`,
    ``,
    `4. Draft Execution Sequence`,
    `Step 1: Confirm dossier parties, authority, KYC, and compliance evidence.`,
    `Step 2: Complete SPA and annex package review.`,
    `Step 3: Confirm settlement method, banking path, release conditions, and financial instrument requirements.`,
    `Step 4: Confirm refinery or receiving location, intake protocol, assay protocol, and custody procedure.`,
    `Step 5: Activate execution instruments once reviewed by authorized operators.`,
    `Step 6: Move dossier through formal state transitions as gates, approvals, and artifact requirements are satisfied.`,
    `Step 7: Record state transitions, instrument status changes, and execution events in the dossier timeline.`,
    ``,
    `5. Pending Structured Execution Fields`,
    `Execution step sequence: [PENDING]`,
    `Release conditions: [PENDING]`,
    `Operator responsibilities: [PENDING]`,
    `Timeline / milestone dates: [PENDING]`,
    `Exception handling procedure: [PENDING]`,
    ``,
    `6. Source Trace`,
    `Opportunity: ${valueOrPlaceholder(context.source.opportunityTitle)}`,
    `Intake Reference: ${valueOrPlaceholder(context.source.intakeReference)}`,
    `Submitted By: ${valueOrPlaceholder(context.source.submitterName)}`,
    ``,
    `DRAFT NOTICE: This is a system-rendered internal Annex E execution framework preview. Settlement, refinery, release, responsibility, and exception-handling fields must be completed before external issuance.`,
  ].join('\n')

  return {
    instrumentType: 'ANNEX_E_PROCEDURE',
    title: 'Annex E · Execution Framework Draft Preview',
    renderedText,
    missingFields,
    warnings,
  }
}
