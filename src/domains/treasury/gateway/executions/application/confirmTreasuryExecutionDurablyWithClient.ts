import type { TransactionClient } from "@prisma/client";

import { confirmTreasuryExecution } from "../confirmTreasuryExecution";

import { executeDurableTreasuryExecutionTransitionWithClient } from "./executeDurableTreasuryExecutionTransitionWithClient";

import type { VerifiedTreasuryExecutionSettlement } from "../verifiedSettlementContracts";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryExecutionConfirmedPayload } from "../events";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export async function confirmTreasuryExecutionDurablyWithClient(params: {
  settlement: VerifiedTreasuryExecutionSettlement;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionConfirmedPayload>
> {
  const { settlement, eventId, context, client } = params;

  return executeDurableTreasuryExecutionTransitionWithClient({
    executionId: settlement.executionId,

    eventId,

    context,

    apply: (aggregate) =>
      confirmTreasuryExecution(aggregate, {
        context,

        payload: {
          executionId: settlement.executionId,

          amount: settlement.amount,

          verifiedAt: settlement.verifiedAt,
        },
      }),

    client,
  });
}
