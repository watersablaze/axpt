// src/components/case/caseProgression.ts

export type CaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ESCROW_INITIATED'
  | 'ESCROW_HOLD'
  | 'ESCROW_DISPUTED'
  | 'SETTLED_RELEASED'
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

  // =========================
  // 🔥 ESCROW STATE (UPGRADED)
  // =========================
  const isEscrowActive = [
    'ESCROW_INITIATED',
    'ESCROW_HOLD',
    'ESCROW_DISPUTED',
    'SETTLED_RELEASED',
  ].includes(status);

  const escrowLabel =
    status === 'ESCROW_INITIATED'
      ? 'Initiated'
      : status === 'ESCROW_HOLD'
      ? 'On Hold'
      : status === 'ESCROW_DISPUTED'
      ? 'Disputed'
      : status === 'SETTLED_RELEASED'
      ? 'Released'
      : null;

  return {
    status,
    gates: sortedGates,
    completedGates,
    totalGates: sortedGates.length,

    // 🔥 REPLACE OLD FLAG
    isEscrowActive,
    escrowLabel,

    isClosed: status === 'CLOSED',
  };
}