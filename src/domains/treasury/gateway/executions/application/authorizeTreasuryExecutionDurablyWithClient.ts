import type { TransactionClient } from "@prisma/client";

import { authorizeTreasuryExecution } from "../authorizeTreasuryExecution";

import { executeDurableTreasuryExecutionTransitionWithClient } from "./executeDurableTreasuryExecutionTransitionWithClient";

import type { AuthorizeTreasuryExecution } from "../commands";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

import type { TreasuryExecutionAuthorizedPayload } from "../events";

export async function authorizeTreasuryExecutionDurablyWithClient(params: {
  command: AuthorizeTreasuryExecution;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionAuthorizedPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableTreasuryExecutionTransitionWithClient({
    executionId: command.payload.executionId,

    eventId,

    context: command.context,

    apply: (aggregate) => authorizeTreasuryExecution(aggregate, command),

    client,
  });
}
