import type { TransactionClient } from "@prisma/client";

import { triggerTreasuryExecutionWithClient } from "@/domains/treasury/triggerExecutionWithClient";

import { createLegacyTreasuryActionDraft } from "./createLegacyTreasuryActionDraft";

import { persistLegacyTreasuryActionDraftWithClient } from "./persistLegacyTreasuryActionDraftWithClient";

import type { TreasuryExecutionHandoff } from "../../handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../routing/contracts";

import type { AuthorizedInternalWalletExecutionDispatchResult } from "./dispatchContracts";

export async function dispatchAuthorizedInternalWalletExecutionWithClient(params: {
  handoff: TreasuryExecutionHandoff;

  route: ResolvedTreasuryExecutionRoute;

  client: TransactionClient;
}): Promise<AuthorizedInternalWalletExecutionDispatchResult> {
  const { handoff, route, client } = params;

  const draft = createLegacyTreasuryActionDraft({
    handoff,
    route,
  });

  const persistedAction = await persistLegacyTreasuryActionDraftWithClient({
    draft,
    client,
  });

  const queueJob = await triggerTreasuryExecutionWithClient(
    persistedAction.id,
    client,
  );

  const queuedAction = await client.treasuryAction.findUnique({
    where: {
      id: persistedAction.id,
    },

    select: {
      id: true,
      status: true,
    },
  });

  if (!queuedAction) {
    throw new Error("[TREASURY_GATEWAY_DISPATCH_ACTION_MISSING_AFTER_QUEUE]");
  }

  return {
    gatewayExecutionId: handoff.executionId,

    gatewayHandoffId: handoff.id,

    treasuryActionId: queuedAction.id,

    treasuryActionStatus: queuedAction.status,

    treasuryQueueJobId: queueJob.id,

    treasuryQueueStatus: queueJob.status,
  };
}
