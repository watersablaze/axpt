import type {
  ArtifactId,
  TreasuryAuthorityGrantId,
  TreasuryInstructionId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { TransferAuthorityAssessmentResult } from "./contracts";

export type RecordTransferAuthorityAssessment = TreasuryCommand<{
  transferId: TreasuryTransferId;

  result: TransferAuthorityAssessmentResult;

  instructionId?: TreasuryInstructionId;

  authorityGrantId?: TreasuryAuthorityGrantId;

  evidenceArtifactIds: readonly ArtifactId[];

  assessedAt: Date;

  notes?: string;
}>;
