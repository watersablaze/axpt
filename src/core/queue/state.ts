export type CaseState = {
  caseId: string

  caseStatus: string
  escrowStatus?: string | null

  gates: {
    total: number
    pending: number
    verified: number
    signaturePending: number
  }

  artifacts: {
    required: number
    submitted: number
  }

  risk: number
  urgency: number
}