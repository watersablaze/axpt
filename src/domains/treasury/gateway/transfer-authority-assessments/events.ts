import type {
  ArtifactId,
  TransferAuthorityAssessmentId,
  TreasuryActorId,
  TreasuryAuthorityGrantId,
  TreasuryInstructionId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TransferAuthorityAssessmentResult } from "./contracts";

export type TransferAuthorityAssessmentRecordedPayload = Readonly<{
  assessmentId: TransferAuthorityAssessmentId;

  transferId: TreasuryTransferId;

  result: TransferAuthorityAssessmentResult;

  instructionId?: TreasuryInstructionId;

  authorityGrantId?: TreasuryAuthorityGrantId;

  evidenceArtifactIds: readonly ArtifactId[];

  assessedByActorId: TreasuryActorId;

  assessedAt: Date;

  notes?: string;
}>;
