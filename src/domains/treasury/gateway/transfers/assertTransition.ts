import {
  TREASURY_TRANSFER_STATUS,
  type TreasuryTransferStatus,
} from "./status";

const TRANSFER_TRANSITIONS: Record<
  TreasuryTransferStatus,
  TreasuryTransferStatus[]
> = {
  CREATED: [TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW],

  AUTHORITY_REVIEW: [
    TREASURY_TRANSFER_STATUS.AUTHORIZED,
    TREASURY_TRANSFER_STATUS.REQUIRES_CLARIFICATION,
    TREASURY_TRANSFER_STATUS.REJECTED,
  ],

  AUTHORIZED: [
    TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    TREASURY_TRANSFER_STATUS.CAPACITY_UNDETERMINED,
  ],

  CAPACITY_ASSESSED: [],

  CAPACITY_UNDETERMINED: [],

  REQUIRES_CLARIFICATION: [],

  REJECTED: [],
};

export function assertTreasuryTransferTransition(
  from: TreasuryTransferStatus,

  to: TreasuryTransferStatus,
): void {
  const allowed = TRANSFER_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new Error(`[TREASURY_TRANSFER_TRANSITION_INVALID] ${from} -> ${to}`);
  }
}
