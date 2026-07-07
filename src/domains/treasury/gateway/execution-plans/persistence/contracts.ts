import type { TreasuryExecutionPlan } from "../contracts";

import type { TreasuryExecutionPlanRecordedPayload } from "../events";

import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

export type PersistedNewTreasuryExecutionPlan = Readonly<{
  aggregate: TreasuryExecutionPlan;

  event: TreasuryEventEnvelope<TreasuryExecutionPlanRecordedPayload>;
}>;

export type PersistedTreasuryExecutionPlanTransition<TPayload> = Readonly<{
  aggregate: TreasuryExecutionPlan;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedTreasuryExecutionPlan = Readonly<{
  aggregate: TreasuryExecutionPlan;

  loadedAt: Date;
}>;
