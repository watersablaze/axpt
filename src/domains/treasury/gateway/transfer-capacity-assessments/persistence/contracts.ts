import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { TransferCapacityAssessment } from "../contracts";

import type { TransferCapacityAssessmentRecordedPayload } from "../events";

export type PersistedNewTransferCapacityAssessment = Readonly<{
  aggregate: TransferCapacityAssessment;

  event: TreasuryEventEnvelope<TransferCapacityAssessmentRecordedPayload>;
}>;

export type LoadedTransferCapacityAssessment = Readonly<{
  aggregate: TransferCapacityAssessment;

  loadedAt: Date;
}>;
