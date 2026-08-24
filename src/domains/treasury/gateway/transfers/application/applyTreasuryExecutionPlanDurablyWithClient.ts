import type { TransactionClient } from "@prisma/client";

import { loadTreasuryExecutionPlanWithClient } from "../../execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import { applyTreasuryExecutionPlan } from "../applyTreasuryExecutionPlan";

import type { TreasuryTransferPlannedPayload } from "../events";

import type { PersistedTreasuryTransferTransition } from "../persistence/contracts";

import { executeDurableTreasuryTransferTransitionWithClient } from "./executeDurableTreasuryTransferTransitionWithClient";

export async function applyTreasuryExecutionPlanDurablyWithClient(params: {
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryTransferTransition<TreasuryTransferPlannedPayload>
> {
  const { transferId, planId, eventId, context, client } = params;

  const loadedPlan = await loadTreasuryExecutionPlanWithClient({
    planId,

    client,
  });

  if (!loadedPlan) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_PLAN_NOT_FOUND] ${planId}`);
  }

  return executeDurableTreasuryTransferTransitionWithClient({
    transferId,

    eventId,

    context,

    apply: (aggregate) =>
      applyTreasuryExecutionPlan(
        aggregate,

        loadedPlan.aggregate,

        {
          context,

          payload: {
            transferId,

            planId,
          },
        },
      ),

    client,
  });
}
