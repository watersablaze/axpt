export type DossierTemplateFieldStatus =
  | 'PRESENT'
  | 'MISSING'
  | 'WARNING'

export type DossierTemplateIssue = {
  field: string
  label: string
  status: DossierTemplateFieldStatus
  detail: string
}

export type DossierTemplateParty = {
  role: string
  legalName: string | null
  representative: string | null
  country: string | null
  notes: string | null
}

export type DossierTemplateTerms = {
  settlementMethod: string | null
  financialInstrumentType: string | null
  issuingInstitution: string | null
  instrumentAmountOrCoverage: string | null
  validityPeriod: string | null
  paymentTrigger: string | null
  beneficiary: string | null

  sellerSideCompensation: string | null
  buyerSideCompensation: string | null
  compensationPayer: string | null
  compensationPayees: string | null
  compensationPayoutTrigger: string | null
  compensationPaymentMethod: string | null
  compensationAuthorizationStatus: string | null
  compensationConfidentialityNote: string | null
}

export type DossierTemplateContext = {
  dossier: {
    id: string
    reference: string
    title: string
    state: string
    commodity: string | null
    origin: string | null
    quantityKg: string | null
    refinery: string | null
    settlement: string | null
  }
  parties: {
    buyer: DossierTemplateParty | null
    seller: DossierTemplateParty | null
    all: DossierTemplateParty[]
  }
  terms: DossierTemplateTerms
  source: {
    opportunityTitle: string | null
    intakeReference: string | null
    referralCode: string | null
    referredByName: string | null
    submitterName: string | null
    submitterEmail: string | null
  }
}

export type DossierInstrumentRenderResult = {
  instrumentType: string
  title: string
  renderedText: string
  missingFields: DossierTemplateIssue[]
  warnings: DossierTemplateIssue[]
}
