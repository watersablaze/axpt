import {
  TREASURY_TRANSFER_STATUS,
  type TreasuryTransferStatus,
} from "./status";

const TRANSFER_TRANSITIONS: Record<
  TreasuryTransferStatus,
  TreasuryTransferStatus[]
> = {
  CREATED: [TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW],

  AUTHORITY_REVIEW: [],
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
