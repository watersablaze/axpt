import type { CaseStatus } from '@/shared/types/case'

export const CaseStateTransitions: Record<CaseStatus, CaseStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_REVIEW', 'ACTIVE', 'CANCELLED'],
  IN_REVIEW: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ESCROW_INITIATED', 'COMPLETED', 'CANCELLED'],
  ESCROW_INITIATED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: [],
}

export function canTransitionCaseStatus(
  from: CaseStatus,
  to: CaseStatus
): boolean {
  return CaseStateTransitions[from].includes(to)
}