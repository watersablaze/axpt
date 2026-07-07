import type {
  ArtifactId,
  ExecutableTrancheEligibilityAssessmentId,
  ExecutableTrancheId,
  TreasuryActorId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

export const EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT = {
  ELIGIBLE: "ELIGIBLE",

  INELIGIBLE: "INELIGIBLE",

  REQUIRES_CLARIFICATION: "REQUIRES_CLARIFICATION",
} as const;

export type ExecutableTrancheEligibilityResult =
  (typeof EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT)[keyof typeof EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT];

export type ExecutableTrancheEligibilityAssessment = Readonly<{
  id: ExecutableTrancheEligibilityAssessmentId;

  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  result: ExecutableTrancheEligibilityResult;

  evidenceArtifactIds: readonly ArtifactId[];

  assessedByActorId: TreasuryActorId;

  assessedAt: Date;

  notes?: string;

  metadata: TreasuryAggregateMetadata;
}>;
