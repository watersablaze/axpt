import type {
  BeneficiaryProfileId,
  ExecutableTrancheId,
  SettlementEndpointId,
  TransferCapacityAssessmentId,
  TreasuryActorId,
  TreasuryAllocationId,
  TreasuryExecutionPlanId,
  TreasuryInstructionId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { TreasuryExecutionKind } from "../executions/contracts";

import type {
  ExecutableTrancheStatus,
  TreasuryExecutionPlanStatus,
} from "./status";

export type ExecutableTranche = Readonly<{
  id: ExecutableTrancheId;

  sequence: number;

  amount: TreasuryMoney;

  executionKind: TreasuryExecutionKind;

  allocationId: TreasuryAllocationId;

  instructionId?: TreasuryInstructionId;

  beneficiaryProfileId?: BeneficiaryProfileId;

  settlementEndpointId: SettlementEndpointId;

  purpose: string;

  status: ExecutableTrancheStatus;
}>;

export type TreasuryExecutionPlan = Readonly<{
  id: TreasuryExecutionPlanId;

  transferId: TreasuryTransferId;

  capacityAssessmentId: TransferCapacityAssessmentId;

  plannedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  tranches: readonly ExecutableTranche[];

  status: TreasuryExecutionPlanStatus;

  plannedByActorId: TreasuryActorId;

  plannedAt: Date;

  notes?: string;

  metadata: TreasuryAggregateMetadata;
}>;
