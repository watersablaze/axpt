import type {
  TreasuryEventEnvelope,
} from "../../events/eventEnvelope";

import type {
  SettlementSource,
} from "../contracts";

import type {
  SettlementSourceRegisteredPayload,
} from "../events";

export type PersistedNewSettlementSource =
  Readonly<{
    aggregate: SettlementSource;

    event:
      TreasuryEventEnvelope<
        SettlementSourceRegisteredPayload
      >;
  }>;

export type LoadedSettlementSource =
  Readonly<{
    aggregate: SettlementSource;

    loadedAt: Date;
  }>;
