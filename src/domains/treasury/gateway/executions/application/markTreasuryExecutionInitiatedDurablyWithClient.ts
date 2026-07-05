import type { TransactionClient } from "@prisma/client";

import { markTreasuryExecutionInitiated } from "../markTreasuryExecutionInitiated";

import { executeDurableTreasuryExecutionTransitionWithClient } from "./executeDurableTreasuryExecutionTransitionWithClient";

import type { MarkTreasuryExecutionInitiated } from "../commands";

import type { TreasuryExecutionInitiatedPayload } from "../events";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export async function markTreasuryExecutionInitiatedDurablyWithClient(params: {
  command: MarkTreasuryExecutionInitiated;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionInitiatedPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableTreasuryExecutionTransitionWithClient({
    executionId: command.payload.executionId,

    eventId,

    context: command.context,

    apply: (aggregate) => markTreasuryExecutionInitiated(aggregate, command),

    client,
  });
}
