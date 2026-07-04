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
