import type {
  TreasuryExecutionPlanId,
  TransferCapacityAssessmentId,
  TreasuryActorId,
  TreasuryTransferId,
  ExecutableTrancheEligibilityAssessmentId,
  ExecutableTrancheId,
  TreasuryExecutionId,
} from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { ExecutableTranche } from "./contracts";

export type TreasuryExecutionPlanRecordedPayload = Readonly<{
  planId: TreasuryExecutionPlanId;

  transferId: TreasuryTransferId;

  capacityAssessmentId: TransferCapacityAssessmentId;

  plannedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  tranches: readonly ExecutableTranche[];

  plannedByActorId: TreasuryActorId;

  plannedAt: Date;

  notes?: string;
}>;

export type ExecutableTrancheEligibilityAppliedPayload = Readonly<{
  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  assessmentId: ExecutableTrancheEligibilityAssessmentId;
}>;

export type ExecutableTrancheBoundToExecutionPayload = Readonly<{
  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  executionId: TreasuryExecutionId;
}>;