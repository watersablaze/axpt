export type OpportunitySource =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'PHONE'
  | 'REFERRAL'
  | 'LOI'
  | 'WEBSITE'
  | 'INTERNAL'
  | 'DIRECT'
  | 'OTHER'

export type OpportunityStatus =
  | 'INTAKE'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROMOTED'
  | 'ARCHIVED'

export type OpportunityEventType =
  | 'OPPORTUNITY_CREATED'
  | 'OPPORTUNITY_UPDATED'
  | 'OPPORTUNITY_REVIEWED'
  | 'OPPORTUNITY_APPROVED'
  | 'OPPORTUNITY_REJECTED'
  | 'OPPORTUNITY_PROMOTED'
  | 'OPPORTUNITY_ARCHIVED'

export type OpportunityRecord = {
  id: string
  title: string
  source: OpportunitySource
  status: OpportunityStatus

  commodity: string | null
  buyerName: string | null
  sellerName: string | null
  origin: string | null
  destination: string | null
  quantityKg: string | null

  notes: string | null
  dossierId: string | null
  promotedDossierId: string | null

  createdAt: string
  updatedAt: string
}