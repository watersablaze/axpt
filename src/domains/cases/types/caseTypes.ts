import type { CaseWorkflowType, CaseStatus, GateStatus } from './workflowTypes';

export type CasePartyRole =
  | 'OWNER'
  | 'PARTICIPANT'
  | 'VERIFIER'
  | 'ARBITER'
  | 'COUNCIL'
  | 'FUNDER';

export interface CaseParty {
  id: string;
  identityId?: string;
  userId?: string;
  role: CasePartyRole;
  label?: string;
}

export interface CaseGate {
  id: string;
  name: string;
  order: number;
  status: GateStatus;
}

export interface CaseArtifact {
  id: string;
  title: string;
  type: string;
  storageUrl?: string;
  verified?: boolean;
}

export interface CaseRecord {
  id: string;
  title: string;
  workflowType: CaseWorkflowType;
  status: CaseStatus;
  parties: CaseParty[];
  gates: CaseGate[];
  artifacts: CaseArtifact[];
}