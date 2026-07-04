import type {
  CommercialProgramId,
  ProgramAccountId,
  TreasuryActorId,
  TreasuryAllocationId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryAllocationStatus } from "./status";

export const TREASURY_ALLOCATION_PURPOSE = {
  BENEFICIARY_DISTRIBUTIONS: "BENEFICIARY_DISTRIBUTIONS",

  PROGRAM_OPERATIONS: "PROGRAM_OPERATIONS",

  RESERVE: "RESERVE",

  TAX: "TAX",

  ESCROW: "ESCROW",

  LOGISTICS: "LOGISTICS",

  FEES: "FEES",

  CAPITAL_RETURN: "CAPITAL_RETURN",

  SPECIAL_PURPOSE: "SPECIAL_PURPOSE",
} as const;

export type TreasuryAllocationPurpose =
  (typeof TREASURY_ALLOCATION_PURPOSE)[keyof typeof TREASURY_ALLOCATION_PURPOSE];

export type TreasuryAllocation = Readonly<{
  id: TreasuryAllocationId;

  reference: string;

  programId: CommercialProgramId;

  sourceProgramAccountId: ProgramAccountId;

  instructionId?: TreasuryInstructionId;

  purposeType: TreasuryAllocationPurpose;

  purposeReference?: string;

  amount: TreasuryMoney;

  consumedAmount: TreasuryMoney;

  status: TreasuryAllocationStatus;

  approvedByActorId?: TreasuryActorId;

  approvedAt?: Date;

  activatedAt?: Date;

  metadata: TreasuryAggregateMetadata;
}>;
