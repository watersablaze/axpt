import type {
  BeneficiaryProfileId,
  CommercialProgramId,
  SettlementEndpointId,
  TreasuryAllocationId,
  TreasuryExecutionId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryExecutionStatus } from "./status";

export const TREASURY_EXECUTION_KIND = {
  BENEFICIARY_DISTRIBUTION: "BENEFICIARY_DISTRIBUTION",

  PROGRAM_TRANSFER: "PROGRAM_TRANSFER",

  CAPITAL_RETURN: "CAPITAL_RETURN",

  FEE: "FEE",

  TAX: "TAX",

  RESERVE_RELEASE: "RESERVE_RELEASE",

  OTHER: "OTHER",
} as const;

export type TreasuryExecutionKind =
  (typeof TREASURY_EXECUTION_KIND)[keyof typeof TREASURY_EXECUTION_KIND];

export type TreasuryExecution = Readonly<{
  id: TreasuryExecutionId;

  reference: string;

  programId: CommercialProgramId;

  allocationId: TreasuryAllocationId;

  instructionId?: TreasuryInstructionId;

  kind: TreasuryExecutionKind;

  beneficiaryProfileId?: BeneficiaryProfileId;

  settlementEndpointId?: SettlementEndpointId;

  amount: TreasuryMoney;

  purpose: string;

  status: TreasuryExecutionStatus;

  validatedAt?: Date;

  authorizedAt?: Date;

  metadata: TreasuryAggregateMetadata;
}>;
