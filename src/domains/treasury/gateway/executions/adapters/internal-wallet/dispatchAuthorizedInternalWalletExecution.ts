import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { triggerTreasuryExecution } from "@/domains/treasury/triggerExecution";

import { createLegacyTreasuryActionDraft } from "./createLegacyTreasuryActionDraft";

import { persistLegacyTreasuryActionDraft } from "./persistLegacyTreasuryActionDraft";

import type { TreasuryExecutionHandoff } from "../../handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../routing/contracts";

import type { AuthorizedInternalWalletExecutionDispatchResult } from "./dispatchContracts";

export async function dispatchAuthorizedInternalWalletExecution(params: {
  handoff: TreasuryExecutionHandoff;

  route: ResolvedTreasuryExecutionRoute;
}): Promise<AuthorizedInternalWalletExecutionDispatchResult> {
  const { handoff, route } = params;

  const draft = createLegacyTreasuryActionDraft({
    handoff,
    route,
  });

  return prisma.$transaction(async (tx: TransactionClient) => {
    const persistedAction = await persistLegacyTreasuryActionDraft({
      draft,
      client: tx,
    });

    const queueJob = await triggerTreasuryExecution(persistedAction.id, tx);

    const queuedAction = await tx.treasuryAction.findUnique({
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
  });
}
