import type {
  TransferCapacityAssessmentId,
  TreasuryActorId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

import type { TransferCapacityConstraint } from "./contracts";

export type TransferCapacityAssessmentRecordedPayload = Readonly<{
  assessmentId: TransferCapacityAssessmentId;

  transferId: TreasuryTransferId;

  requestedAmount: TreasuryMoney;

  constraints: readonly TransferCapacityConstraint[];

  executableNow?: TreasuryMoney;

  assessedByActorId: TreasuryActorId;

  assessedAt: Date;

  notes?: string;
}>;
