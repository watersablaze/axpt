import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { TreasuryAllocation } from "../contracts";
import type { TreasuryAllocationCreatedPayload } from "../events";

export type PersistedNewTreasuryAllocation = Readonly<{
  aggregate: TreasuryAllocation;

  event: TreasuryEventEnvelope<TreasuryAllocationCreatedPayload>;
}>;

export type PersistedTreasuryAllocationTransition<TPayload> = Readonly<{
  aggregate: TreasuryAllocation;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedTreasuryAllocation = Readonly<{
  aggregate: TreasuryAllocation;

  loadedAt: Date;
}>;
