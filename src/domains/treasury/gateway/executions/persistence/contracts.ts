import type { TreasuryExecution } from "../contracts";

import type { TreasuryExecutionCreatedPayload } from "../events";

import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

export type PersistedNewTreasuryExecution = Readonly<{
  aggregate: TreasuryExecution;

  event: TreasuryEventEnvelope<TreasuryExecutionCreatedPayload>;
}>;

export type PersistedTreasuryExecutionTransition<TPayload> = Readonly<{
  aggregate: TreasuryExecution;

  event: TreasuryEventEnvelope<TPayload>;
}>;
