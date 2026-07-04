import type {
  BeneficiaryProfileId,
  CommercialProgramId,
  SettlementEndpointId,
  TreasuryActorId,
  TreasuryAllocationId,
  TreasuryApprovalId,
  TreasuryCorrelationId,
  TreasuryCausationId,
  TreasuryExecutionHandoffId,
  TreasuryExecutionId,
  TreasuryIdempotencyKey,
  TreasuryInstructionId,
} from "../../shared/identifiers";

import type { TreasuryMoney } from "../../shared/money";

import type { TreasuryExecutionKind } from "../contracts";

export type TreasuryExecutionHandoffAuthorization = Readonly<{
  approvalIds: readonly TreasuryApprovalId[];

  authorizedAt: Date;
}>;

export type TreasuryExecutionHandoffContext = Readonly<{
  requestedByActorId: TreasuryActorId;

  correlationId: TreasuryCorrelationId;

  causationId?: TreasuryCausationId;

  idempotencyKey: TreasuryIdempotencyKey;

  requestedAt: Date;
}>;

export type TreasuryExecutionHandoff = Readonly<{
  id: TreasuryExecutionHandoffId;

  executionId: TreasuryExecutionId;

  executionVersion: number;

  programId: CommercialProgramId;

  allocationId: TreasuryAllocationId;

  instructionId?: TreasuryInstructionId;

  kind: TreasuryExecutionKind;

  beneficiaryProfileId?: BeneficiaryProfileId;

  settlementEndpointId?: SettlementEndpointId;

  amount: TreasuryMoney;

  purpose: string;

  authorization: TreasuryExecutionHandoffAuthorization;

  context: TreasuryExecutionHandoffContext;
}>;
