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

export type LoadedTreasuryExecution = Readonly<{
  aggregate: TreasuryExecution;

  loadedAt: Date;
}>;

export type LoadedTreasuryExecutionAuthorizationEvidence = Readonly<{
  approvalIds: readonly string[];

  authorizedAt: Date;

  eventId: string;

  aggregateVersion: number;
}>;
