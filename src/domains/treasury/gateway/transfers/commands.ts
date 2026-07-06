import type {
  CommercialProgramId,
  TreasuryInstructionId,
  TreasuryTransferId,
  TransferAuthorityAssessmentId,
  TransferCapacityAssessmentId,
  TreasuryExecutionPlanId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { TreasuryTransferLocation } from "./contracts";

export type CreateTreasuryTransfer = TreasuryCommand<{
  programId: CommercialProgramId;

  instructionId?: TreasuryInstructionId;

  source: TreasuryTransferLocation;

  destination: TreasuryTransferLocation;

  requestedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  purpose: string;
}>;

export type BeginTreasuryTransferAuthorityReview = TreasuryCommand<{
  transferId: TreasuryTransferId;
}>;

export type ApplyTreasuryTransferAuthorityAssessment = TreasuryCommand<{
  transferId: TreasuryTransferId;

  assessmentId: TransferAuthorityAssessmentId;
}>;

export type ApplyTreasuryTransferCapacityAssessment = TreasuryCommand<{
  transferId: TreasuryTransferId;

  assessmentId: TransferCapacityAssessmentId;
}>;

export type ApplyTreasuryExecutionPlan = TreasuryCommand<{
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;
}>;
