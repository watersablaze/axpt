// src/components/case/caseProgression.ts

export type CaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ESCROW_INITIATED'
  | 'CLOSED';

export type GateStatus =
  | 'OPEN'
  | 'VERIFIED'
  | 'REJECTED';

export interface GateSummary {
  id: string;
  ord: number;
  name: string;
  status: GateStatus;
}

export interface CaseProgressionInput {
  status: CaseStatus;
  gates: GateSummary[];
}

export function deriveProgression(input: CaseProgressionInput) {
  const { status, gates } = input;

  const sortedGates = [...gates].sort((a, b) => a.ord - b.ord);

  const completedGates = sortedGates.filter(
    (g) => g.status === 'VERIFIED'
  ).length;

  const isEscrowInitiated = status === 'ESCROW_INITIATED';

  return {
    status,
    gates: sortedGates,
    completedGates,
    totalGates: sortedGates.length,
    isEscrowInitiated,
    isClosed: status === 'CLOSED',
  };
}