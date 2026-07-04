import type {
  CommercialProgramId,
  ProgramAccountId,
  TreasuryAllocationId,
  TreasuryApprovalId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryAllocationPurpose } from "./contracts";

export type CreateTreasuryAllocation = TreasuryCommand<{
  programId: CommercialProgramId;

  sourceProgramAccountId: ProgramAccountId;

  instructionId?: TreasuryInstructionId;

  purposeType: TreasuryAllocationPurpose;

  purposeReference?: string;

  amount: TreasuryMoney;
}>;

export type SubmitTreasuryAllocationForReview = TreasuryCommand<{
  allocationId: TreasuryAllocationId;
}>;

export type ApproveTreasuryAllocation = TreasuryCommand<{
  allocationId: TreasuryAllocationId;

  approvalIds: readonly TreasuryApprovalId[];
}>;

export type ActivateTreasuryAllocation = TreasuryCommand<{
  allocationId: TreasuryAllocationId;
}>;

export type ConsumeTreasuryAllocation = TreasuryCommand<{
  allocationId: TreasuryAllocationId;

  amount: TreasuryMoney;

  consumingSubjectType: string;

  consumingSubjectId: string;
}>;

export type ReleaseTreasuryAllocation = TreasuryCommand<{
  allocationId: TreasuryAllocationId;

  reason: string;
}>;
