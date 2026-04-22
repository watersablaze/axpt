export type CaseEventName =
  | 'CASE_CREATED'
  | 'CASE_OPENED'
  | 'CASE_COMPLETED'
  | 'CASE_STATUS_CHANGED'
  | 'PARTY_ADDED'
  | 'ARTIFACT_UPLOADED'
  | 'GATE_ACTIVATED'
  | 'GATE_VERIFIED'
  | 'GATE_REJECTED'
  | 'ESCROW_LOCKED'
  | 'ESCROW_RELEASED'

export type CaseEventPayload = {
  caseId: string;
  gateId?: string;
  artifactId?: string;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
};

export type CaseDomainEvent = {
  name: CaseEventName;
  payload: CaseEventPayload;
  occurredAt: string;
};