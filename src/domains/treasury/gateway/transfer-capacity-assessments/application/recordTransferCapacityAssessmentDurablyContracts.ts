import type { RecordTransferCapacityAssessment } from "../commands";

import type {
  TransferCapacityAssessmentId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

export type RecordTransferCapacityAssessmentDurably = Readonly<{
  assessmentId: TransferCapacityAssessmentId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  payload: RecordTransferCapacityAssessment["payload"];
}>;
