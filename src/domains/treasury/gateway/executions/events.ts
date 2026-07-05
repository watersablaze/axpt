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

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryExecutionKind } from "./contracts";

import type { TreasuryExecutionAdapterKind } from "./routing/contracts";

export type TreasuryExecutionCreatedPayload = Readonly<{
  executionId: TreasuryExecutionId;

  programId: CommercialProgramId;

  allocationId: TreasuryAllocationId;

  instructionId?: TreasuryInstructionId;

  kind: TreasuryExecutionKind;

  beneficiaryProfileId?: BeneficiaryProfileId;

  settlementEndpointId?: SettlementEndpointId;

  amount: TreasuryMoney;

  purpose: string;
}>;

export type TreasuryExecutionValidationStartedPayload = Readonly<{
  executionId: TreasuryExecutionId;
}>;

export type TreasuryExecutionReadyForAuthorizationPayload = Readonly<{
  executionId: TreasuryExecutionId;

  validationEvidenceArtifactIds?: readonly ArtifactId[];

  validationNotes?: string;

  validatedAt: Date;
}>;

export type TreasuryExecutionAuthorizedPayload = Readonly<{
  executionId: TreasuryExecutionId;

  approvalIds: readonly TreasuryApprovalId[];

  authorizedAt: Date;
}>;

export type TreasuryExecutionQueuedPayload = Readonly<{
  executionId: TreasuryExecutionId;

  handoffId: string;

  adapterKind: TreasuryExecutionAdapterKind;

  settlementEndpointId: SettlementEndpointId;

  treasuryActionId: string;

  treasuryQueueJobId: string;

  queuedAt: Date;
}>;

export type TreasuryExecutionInitiatedPayload = Readonly<{
  executionId: TreasuryExecutionId;

  treasuryActionId: string;

  treasuryActionStatus: string;

  idempotencyKey: string;

  initiatedAt: Date;
}>;

export type TreasuryExecutionConfirmedPayload = Readonly<{
  executionId: TreasuryExecutionId;

  treasuryActionId: string;

  idempotencyKey: string;

  debitTransactionId: string;

  creditTransactionId: string;

  assetCode: string;

  amountBaseUnits: string;

  confirmedAt: Date;
}>;
