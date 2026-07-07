import type {
  ArtifactId,
  ExecutableTrancheId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { ExecutableTrancheEligibilityResult } from "./contracts";

export type RecordExecutableTrancheEligibilityAssessment = TreasuryCommand<{
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  result: ExecutableTrancheEligibilityResult;

  evidenceArtifactIds: readonly ArtifactId[];

  assessedAt: Date;

  notes?: string;
}>;
