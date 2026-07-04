import type {
  ArtifactId,
  BeneficiaryProfileId,
  CommercialProgramId,
  SettlementEndpointId,
  TreasuryAllocationId,
  TreasuryApprovalId,
  TreasuryExecutionId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryExecutionKind } from "./contracts";

export type CreateTreasuryExecution = TreasuryCommand<{
  programId: CommercialProgramId;

  allocationId: TreasuryAllocationId;

  instructionId?: TreasuryInstructionId;

  kind: TreasuryExecutionKind;

  beneficiaryProfileId?: BeneficiaryProfileId;

  settlementEndpointId?: SettlementEndpointId;

  amount: TreasuryMoney;

  purpose: string;
}>;

export type BeginTreasuryExecutionValidation = TreasuryCommand<{
  executionId: TreasuryExecutionId;
}>;

export type MarkTreasuryExecutionReadyForAuthorization = TreasuryCommand<{
  executionId: TreasuryExecutionId;

  validationEvidenceArtifactIds?: readonly ArtifactId[];

  validationNotes?: string;
}>;

export type AuthorizeTreasuryExecution = TreasuryCommand<{
  executionId: TreasuryExecutionId;

  approvalIds: readonly TreasuryApprovalId[];
}>;

export type AcknowledgeTreasuryExecutionQueued = TreasuryCommand<
  Readonly<{
    executionId: TreasuryExecutionId;

    treasuryActionId: string;

    treasuryQueueJobId: string;
  }>
>;
