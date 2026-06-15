type ApprovalSummary = {
  transitionKey: string
  requiredRole: string
  requiredCount: number
  status: string
}

type ArtifactSummary = {
  type: string
  title?: string
  status?: string
  version?: string
}

type ConsequenceSummary = {
  type: string
  label?: string
  detail: string
  severity?: string
}

type Input = {
  dossierId: string
  reference: string
  fromState: string
  toState: string
  operatorEmail: string
  approvals?: ApprovalSummary[]
  generatedArtifacts?: ArtifactSummary[]
  consequences?: ConsequenceSummary[]
}

export function buildTransitionAuditRecord({
  dossierId,
  reference,
  fromState,
  toState,
  operatorEmail,
  approvals = [],
  generatedArtifacts = [],
  consequences = [],
}: Input) {
  return {
    kind: 'TRANSITION_AUDIT_RECORD',
    dossierId,
    reference,
    transition: {
      fromState,
      toState,
      transitionKey: `${fromState}_TO_${toState}`,
    },
    actor: {
      operatorEmail,
    },
    approvals: approvals.map((approval) => ({
      transitionKey: approval.transitionKey,
      requiredRole: approval.requiredRole,
      requiredCount: approval.requiredCount,
      status: approval.status,
    })),
    generatedArtifacts: generatedArtifacts.map((artifact) => ({
      type: artifact.type,
      title: artifact.title,
      status: artifact.status,
      version: artifact.version,
    })),
    consequences: consequences.map((consequence) => ({
      type: consequence.type,
      label: consequence.label,
      detail: consequence.detail,
      severity: consequence.severity,
    })),
    recordedAt: new Date().toISOString(),
  }
}