import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { SettlementEndpoint } from "../contracts";

import type { SettlementEndpointRegisteredPayload } from "../events";

export type PersistedNewSettlementEndpoint = Readonly<{
  aggregate: SettlementEndpoint;

  event: TreasuryEventEnvelope<SettlementEndpointRegisteredPayload>;
}>;

export type LoadedSettlementEndpoint = Readonly<{
  aggregate: SettlementEndpoint;

  loadedAt: Date;
}>;
