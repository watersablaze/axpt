export type CaseStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ACTIVE'
  | 'ESCROW_INITIATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

export type GateStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'

export type CaseGate = {
  id: string
  name: string
  ord: number
  status: GateStatus
  gateType?: string
}

export type CaseData = {
  id: string
  title: string
  status: CaseStatus
  jurisdiction?: string | null
  createdAt: string
}