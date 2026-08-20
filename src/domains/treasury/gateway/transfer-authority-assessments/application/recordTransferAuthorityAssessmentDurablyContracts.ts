import type { RecordTransferAuthorityAssessment } from "../commands";

import type {
  TransferAuthorityAssessmentId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

export type RecordTransferAuthorityAssessmentDurably = Readonly<{
  assessmentId: TransferAuthorityAssessmentId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  payload: RecordTransferAuthorityAssessment["payload"];
}>;
