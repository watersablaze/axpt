import type { TreasuryExecution } from "../contracts";

import type { TreasuryExecutionCreatedPayload } from "../events";

import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

export type PersistedNewTreasuryExecution = Readonly<{
  aggregate: TreasuryExecution;

  event: TreasuryEventEnvelope<TreasuryExecutionCreatedPayload>;
}>;
