import type { TransactionClient } from "@prisma/client";

import { beginTreasuryExecutionValidation } from "../beginTreasuryExecutionValidation";

import { loadTreasuryExecutionWithClient } from "../persistence/loadTreasuryExecutionWithClient";

import { persistTreasuryExecutionTransitionWithClient } from "../persistence/persistTreasuryExecutionTransitionWithClient";

import type { BeginTreasuryExecutionValidation } from "../commands";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

import type { TreasuryExecutionValidationStartedPayload } from "../events";

export async function beginTreasuryExecutionValidationDurablyWithClient(params: {
  command: BeginTreasuryExecutionValidation;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionValidationStartedPayload>
> {
  const { command, eventId, client } = params;

  const loaded = await loadTreasuryExecutionWithClient({
    executionId: command.payload.executionId,

    client,
  });

  if (!loaded) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${command.payload.executionId}`,
    );
  }

  const result = beginTreasuryExecutionValidation(loaded.aggregate, command);

  return persistTreasuryExecutionTransitionWithClient({
    expectedVersion: loaded.aggregate.metadata.version,

    result,

    eventId,

    context: command.context,

    client,
  });
}
