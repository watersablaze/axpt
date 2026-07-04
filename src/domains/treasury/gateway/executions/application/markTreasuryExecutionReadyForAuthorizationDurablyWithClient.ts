import type { TransactionClient } from "@prisma/client";

import { markTreasuryExecutionReadyForAuthorization } from "../markTreasuryExecutionReadyForAuthorization";

import { executeDurableTreasuryExecutionTransitionWithClient } from "./executeDurableTreasuryExecutionTransitionWithClient";

import type { MarkTreasuryExecutionReadyForAuthorization } from "../commands";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

import type { TreasuryExecutionReadyForAuthorizationPayload } from "../events";

export async function markTreasuryExecutionReadyForAuthorizationDurablyWithClient(params: {
  command: MarkTreasuryExecutionReadyForAuthorization;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionReadyForAuthorizationPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableTreasuryExecutionTransitionWithClient({
    executionId: command.payload.executionId,

    eventId,

    context: command.context,

    apply: (aggregate) =>
      markTreasuryExecutionReadyForAuthorization(aggregate, command),

    client,
  });
}
