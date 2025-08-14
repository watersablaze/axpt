export const ProjectStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  FUNDED: 'FUNDED',
} as const;
export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ReviewActions = ['APPROVE', 'DENY', 'REQUEST_INFO'] as const;
export type ReviewAction = typeof ReviewActions[number];