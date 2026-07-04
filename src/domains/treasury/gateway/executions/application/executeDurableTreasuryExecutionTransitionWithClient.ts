import type { TransactionClient } from "@prisma/client";

import { loadTreasuryExecutionWithClient } from "../persistence/loadTreasuryExecutionWithClient";

import { persistTreasuryExecutionTransitionWithClient } from "../persistence/persistTreasuryExecutionTransitionWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type {
  TreasuryEventId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { TreasuryExecution } from "../contracts";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export async function executeDurableTreasuryExecutionTransitionWithClient<
  TPayload,
>(params: {
  executionId: TreasuryExecutionId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  apply: (
    aggregate: TreasuryExecution,
  ) => TreasuryDomainResult<TreasuryExecution, TPayload>;

  client: TransactionClient;
}): Promise<PersistedTreasuryExecutionTransition<TPayload>> {
  const { executionId, eventId, context, apply, client } = params;

  const loaded = await loadTreasuryExecutionWithClient({
    executionId,

    client,
  });

  if (!loaded) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${executionId}`);
  }

  const result = apply(loaded.aggregate);

  return persistTreasuryExecutionTransitionWithClient({
    expectedVersion: loaded.aggregate.metadata.version,

    result,

    eventId,

    context,

    client,
  });
}
