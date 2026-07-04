import type {
  ArtifactId,
  CommercialProgramId,
  TreasuryActorId,
  TreasuryApprovalId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { TreasuryMoney } from "../shared/money";

import type {
  InstructionAuthenticationMethod,
  TreasuryInstructionType,
} from "./contracts";

export type SubmitTreasuryInstruction = TreasuryCommand<{
  programId: CommercialProgramId;

  instructionType: TreasuryInstructionType;

  requestedAmount?: TreasuryMoney;

  purpose: string;

  effectiveDate?: Date;

  expiryDate?: Date;
}>;

export type BeginTreasuryInstructionAuthorityReview = TreasuryCommand<{
  instructionId: TreasuryInstructionId;
}>;

export type AuthenticateTreasuryInstruction = TreasuryCommand<{
  instructionId: TreasuryInstructionId;

  method: InstructionAuthenticationMethod;

  authenticatedActorId?: TreasuryActorId;

  evidenceArtifactId?: ArtifactId;

  notes?: string;
}>;

export type BeginTreasuryInstructionReview = TreasuryCommand<{
  instructionId: TreasuryInstructionId;
}>;

export type RequestTreasuryInstructionClarification = TreasuryCommand<{
  instructionId: TreasuryInstructionId;

  reason: string;

  requestedFromActorId?: TreasuryActorId;
}>;

export type ApproveTreasuryInstruction = TreasuryCommand<{
  instructionId: TreasuryInstructionId;

  approvalIds: readonly TreasuryApprovalId[];
}>;

export type RejectTreasuryInstruction = TreasuryCommand<{
  instructionId: TreasuryInstructionId;

  reason: string;
}>;

export type CancelTreasuryInstruction = TreasuryCommand<{
  instructionId: TreasuryInstructionId;

  reason: string;
}>;

export type FulfillTreasuryInstruction = TreasuryCommand<{
  instructionId: TreasuryInstructionId;
}>;

export type SupersedeTreasuryInstruction = TreasuryCommand<{
  instructionId: TreasuryInstructionId;

  supersededByInstructionId: TreasuryInstructionId;

  reason: string;
}>;
