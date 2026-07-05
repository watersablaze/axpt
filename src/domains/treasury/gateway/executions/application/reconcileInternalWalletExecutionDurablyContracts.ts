import type { TreasuryExecution } from "../contracts";

import type {
  TreasuryExecutionConfirmedPayload,
  TreasuryExecutionInitiatedPayload,
} from "../events";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export type ReconciledInternalWalletExecution = Readonly<{
  aggregate: TreasuryExecution;

  initiated: PersistedTreasuryExecutionTransition<TreasuryExecutionInitiatedPayload> | null;

  confirmed: PersistedTreasuryExecutionTransition<TreasuryExecutionConfirmedPayload> | null;
}>;
