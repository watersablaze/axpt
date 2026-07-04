import type { TreasuryExecution } from "../../contracts";

import type { TreasuryExecutionQueuedPayload } from "../../events";

import type { TreasuryDomainResult } from "../../../shared/domainResult";

import type { AuthorizedInternalWalletExecutionDispatchResult } from "./dispatchContracts";

export type DispatchAndAcknowledgeInternalWalletExecutionResult = Readonly<{
  dispatch: AuthorizedInternalWalletExecutionDispatchResult;

  gateway: TreasuryDomainResult<
    TreasuryExecution,
    TreasuryExecutionQueuedPayload
  >;
}>;
