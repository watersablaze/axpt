import type { AuthorizedInternalWalletExecutionDispatchResult } from "../adapters/internal-wallet/dispatchContracts";

import type { TreasuryExecutionQueuedPayload } from "../events";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export type DurableInternalWalletExecutionDispatchResult = Readonly<{
  dispatch: AuthorizedInternalWalletExecutionDispatchResult;

  gateway: PersistedTreasuryExecutionTransition<TreasuryExecutionQueuedPayload>;
}>;
