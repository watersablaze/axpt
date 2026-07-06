import type {
  ArtifactId,
  TransferAuthorityAssessmentId,
  TreasuryActorId,
  TreasuryAuthorityGrantId,
  TreasuryInstructionId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

export const TRANSFER_AUTHORITY_ASSESSMENT_RESULT = {
  AUTHORIZED: "AUTHORIZED",

  NOT_AUTHORIZED: "NOT_AUTHORIZED",

  REQUIRES_CLARIFICATION: "REQUIRES_CLARIFICATION",
} as const;

export type TransferAuthorityAssessmentResult =
  (typeof TRANSFER_AUTHORITY_ASSESSMENT_RESULT)[keyof typeof TRANSFER_AUTHORITY_ASSESSMENT_RESULT];

export type TransferAuthorityAssessment = Readonly<{
  id: TransferAuthorityAssessmentId;

  transferId: TreasuryTransferId;

  result: TransferAuthorityAssessmentResult;

  instructionId?: TreasuryInstructionId;

  authorityGrantId?: TreasuryAuthorityGrantId;

  evidenceArtifactIds: readonly ArtifactId[];

  assessedByActorId: TreasuryActorId;

  assessedAt: Date;

  notes?: string;

  metadata: TreasuryAggregateMetadata;
}>;
