import type {
  BeneficiaryProfileId,
  ExecutableTrancheId,
  SettlementEndpointId,
  TransferCapacityAssessmentId,
  TreasuryAllocationId,
  TreasuryInstructionId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { TreasuryExecutionKind } from "../executions/contracts";

export type RecordTreasuryExecutionPlanTranche = Readonly<{
  trancheId: ExecutableTrancheId;

  sequence: number;

  amount: TreasuryMoney;

  executionKind: TreasuryExecutionKind;

  allocationId: TreasuryAllocationId;

  instructionId?: TreasuryInstructionId;

  beneficiaryProfileId?: BeneficiaryProfileId;

  settlementEndpointId: SettlementEndpointId;

  purpose: string;
}>;

export type RecordTreasuryExecutionPlan = TreasuryCommand<{
  transferId: TreasuryTransferId;

  capacityAssessmentId: TransferCapacityAssessmentId;

  plannedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  tranches: readonly RecordTreasuryExecutionPlanTranche[];

  plannedAt: Date;

  notes?: string;
}>;
