import type {
  ArtifactId,
  ExecutableTrancheEligibilityAssessmentId,
  ExecutableTrancheId,
  TreasuryActorId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { ExecutableTrancheEligibilityResult } from "./contracts";

export type ExecutableTrancheEligibilityAssessmentRecordedPayload = Readonly<{
  assessmentId: ExecutableTrancheEligibilityAssessmentId;

  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  result: ExecutableTrancheEligibilityResult;

  evidenceArtifactIds: readonly ArtifactId[];

  assessedByActorId: TreasuryActorId;

  assessedAt: Date;

  notes?: string;
}>;
