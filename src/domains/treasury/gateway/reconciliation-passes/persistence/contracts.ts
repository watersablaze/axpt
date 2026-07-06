import type { TreasuryEventEnvelope } from "../../events/eventEnvelope";

import type { TreasuryReconciliationPass } from "../contracts";

import type { TreasuryReconciliationPassRequestedPayload } from "../events";

export type PersistedNewTreasuryReconciliationPass = Readonly<{
  aggregate: TreasuryReconciliationPass;

  event: TreasuryEventEnvelope<TreasuryReconciliationPassRequestedPayload>;
}>;

export type PersistedTreasuryReconciliationPassTransition<TPayload> = Readonly<{
  aggregate: TreasuryReconciliationPass;

  event: TreasuryEventEnvelope<TPayload>;
}>;

export type LoadedTreasuryReconciliationPass = Readonly<{
  aggregate: TreasuryReconciliationPass;

  loadedAt: Date;
}>;
