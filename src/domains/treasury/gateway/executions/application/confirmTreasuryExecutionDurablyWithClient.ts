import type { TransactionClient } from "@prisma/client";

import { confirmTreasuryExecution } from "../confirmTreasuryExecution";

import { executeDurableTreasuryExecutionTransitionWithClient } from "./executeDurableTreasuryExecutionTransitionWithClient";

import type { ConfirmTreasuryExecution } from "../commands";

import type { TreasuryExecutionConfirmedPayload } from "../events";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export async function confirmTreasuryExecutionDurablyWithClient(params: {
  command: ConfirmTreasuryExecution;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionConfirmedPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableTreasuryExecutionTransitionWithClient({
    executionId: command.payload.executionId,

    eventId,

    context: command.context,

    apply: (aggregate) => confirmTreasuryExecution(aggregate, command),

    client,
  });
}
