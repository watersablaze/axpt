// src/lib/guards/caseState.ts

export type CaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ESCROW_INITIATED'
  | 'CLOSED';

export function assertCaseCanEdit(status: CaseStatus) {
  if (status === 'ESCROW_INITIATED' || status === 'CLOSED') {
    throw new Error('CASE_LOCKED');
  }
}

// Alias for readability in route handlers
export const assertCaseEditable = assertCaseCanEdit;

export function assertCaseCanActivate(status: CaseStatus) {
  if (status !== 'DRAFT') {
    throw new Error('CASE_NOT_DRAFT');
  }
}

export function assertCaseCanInitiateEscrow(status: CaseStatus) {
  if (status === 'ESCROW_INITIATED') {
    throw new Error('ESCROW_ALREADY_INITIATED');
  }

  if (status !== 'ACTIVE') {
    throw new Error('CASE_NOT_ACTIVE');
  }
}

export function assertCaseCanClose(status: CaseStatus) {
  if (status !== 'ESCROW_INITIATED') {
    throw new Error('CASE_NOT_READY_FOR_CLOSE');
  }
}
