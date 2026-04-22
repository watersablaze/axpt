export type CaseWorkflowType =
  | 'COORDINATION'
  | 'ESCROW'
  | 'FUNDING'
  | 'GOVERNANCE'
  | 'ARCHIVE'
  | 'ONBOARDING';

export type CaseStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type GateStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PASSED'
  | 'FAILED'
  | 'SKIPPED';