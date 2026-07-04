import type {
  ArtifactId,
  CommercialProgramId,
  TreasuryActorId,
  TreasuryApprovalId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

import type {
  InstructionAuthenticationMethod,
  TreasuryInstructionType,
} from "./contracts";

export type TreasuryInstructionSubmittedPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  programId: CommercialProgramId;

  instructionType: TreasuryInstructionType;

  submittedByActorId: TreasuryActorId;

  requestedAmount?: TreasuryMoney;

  purpose: string;

  effectiveDate?: Date;

  expiryDate?: Date;
}>;

export type TreasuryInstructionAuthorityReviewStartedPayload = Readonly<{
  instructionId: TreasuryInstructionId;
}>;

export type TreasuryInstructionAuthenticatedPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  method: InstructionAuthenticationMethod;

  authenticatedActorId?: TreasuryActorId;

  authenticatedByActorId: TreasuryActorId;

  evidenceArtifactId?: ArtifactId;

  notes?: string;

  authenticatedAt: Date;
}>;

export type TreasuryInstructionReviewStartedPayload = Readonly<{
  instructionId: TreasuryInstructionId;
}>;

export type TreasuryInstructionClarificationRequestedPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  reason: string;

  requestedFromActorId?: TreasuryActorId;
}>;

export type TreasuryInstructionApprovedPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  approvalIds: readonly TreasuryApprovalId[];

  approvedAt: Date;
}>;

export type TreasuryInstructionRejectedPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  reason: string;
}>;

export type TreasuryInstructionCancelledPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  reason: string;
}>;

export type TreasuryInstructionFulfilledPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  fulfilledAt: Date;
}>;

export type TreasuryInstructionSupersededPayload = Readonly<{
  instructionId: TreasuryInstructionId;

  supersededByInstructionId: TreasuryInstructionId;

  reason: string;
}>;
