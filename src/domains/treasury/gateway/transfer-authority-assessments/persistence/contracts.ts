import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { TransferAuthorityAssessment } from "../contracts";

import type { TransferAuthorityAssessmentRecordedPayload } from "../events";

export type PersistedNewTransferAuthorityAssessment = Readonly<{
  aggregate: TransferAuthorityAssessment;

  event: TreasuryEventEnvelope<TransferAuthorityAssessmentRecordedPayload>;
}>;

export type LoadedTransferAuthorityAssessment = Readonly<{
  aggregate: TransferAuthorityAssessment;

  loadedAt: Date;
}>;
