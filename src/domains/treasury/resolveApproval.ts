type ApprovalType = 'SINGLE' | 'DUAL' | 'COUNCIL'

export function resolveApproval(params: {
  approvalType: ApprovalType
  approvals: { decision: string }[]
  totalElders: number
}) {
  const { approvalType, approvals, totalElders } = params

  const approved = approvals.filter(a => a.decision === 'APPROVED').length
  const rejected = approvals.filter(a => a.decision === 'REJECTED').length
  const required =
    approvalType === 'COUNCIL'
      ? Math.ceil(totalElders * 0.6)
      : approvalType === 'DUAL'
      ? 2
      : 1

  if (rejected > 0) {
    return { status: 'REJECTED' as const }
  }

  if (approved >= required) {
    return { status: 'APPROVED' as const }
  }

  return { status: 'PENDING' as const }
}
