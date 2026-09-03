import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { ProgramCapitalReceipt } from "../contracts";

import type { CapitalReceiptReportedPayload } from "../events";

export type PersistedNewProgramCapitalReceipt = Readonly<{
  aggregate: ProgramCapitalReceipt;

  event: TreasuryEventEnvelope<CapitalReceiptReportedPayload>;
}>;

export type PersistedProgramCapitalReceiptTransition<TPayload> = Readonly<{
  aggregate: ProgramCapitalReceipt;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedProgramCapitalReceipt = Readonly<{
  aggregate: ProgramCapitalReceipt;

  loadedAt: Date;
}>;
