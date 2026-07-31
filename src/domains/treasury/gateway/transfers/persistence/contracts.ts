import type { TreasuryTransfer } from "../contracts";

import type { TreasuryTransferCreatedPayload } from "../events";

import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

export type PersistedNewTreasuryTransfer = Readonly<{
  aggregate: TreasuryTransfer;

  event: TreasuryEventEnvelope<TreasuryTransferCreatedPayload>;
}>;

export type PersistedTreasuryTransferTransition<TPayload> = Readonly<{
  aggregate: TreasuryTransfer;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedTreasuryTransfer = Readonly<{
  aggregate: TreasuryTransfer;

  loadedAt: Date;
}>;
