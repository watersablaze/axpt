import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { ProgramCapitalReceipt } from "../contracts";

export type PersistedNewProgramCapitalReceipt<TPayload> = Readonly<{
  aggregate: ProgramCapitalReceipt;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type PersistedProgramCapitalReceiptTransition<TPayload> = Readonly<{
  aggregate: ProgramCapitalReceipt;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedProgramCapitalReceipt = Readonly<{
  aggregate: ProgramCapitalReceipt;

  loadedAt: Date;
}>;
