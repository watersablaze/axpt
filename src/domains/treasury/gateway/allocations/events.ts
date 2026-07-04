import type {
  CommercialProgramId,
  ProgramAccountId,
  TreasuryAllocationId,
  TreasuryApprovalId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryAllocationPurpose } from "./contracts";

export type TreasuryAllocationCreatedPayload = Readonly<{
  allocationId: TreasuryAllocationId;

  programId: CommercialProgramId;

  sourceProgramAccountId: ProgramAccountId;

  instructionId?: TreasuryInstructionId;

  purposeType: TreasuryAllocationPurpose;

  purposeReference?: string;

  amount: TreasuryMoney;
}>;

export type TreasuryAllocationReviewStartedPayload = Readonly<{
  allocationId: TreasuryAllocationId;
}>;

export type TreasuryAllocationApprovedPayload = Readonly<{
  allocationId: TreasuryAllocationId;

  approvalIds: readonly TreasuryApprovalId[];

  approvedAt: Date;
}>;

export type TreasuryAllocationActivatedPayload = Readonly<{
  allocationId: TreasuryAllocationId;

  activatedAt: Date;
}>;

export type TreasuryAllocationConsumedPayload = Readonly<{
  allocationId: TreasuryAllocationId;

  consumedAmount: TreasuryMoney;

  totalConsumedAmount: TreasuryMoney;

  remainingAmount: TreasuryMoney;

  consumingSubjectType: string;

  consumingSubjectId: string;
}>;

export type TreasuryAllocationReleasedPayload = Readonly<{
  allocationId: TreasuryAllocationId;

  releasedAmount: TreasuryMoney;

  totalConsumedAmount: TreasuryMoney;

  reason: string;

  releasedAt: Date;
}>;
