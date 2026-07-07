import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type {
  TreasuryEventId,
  TreasuryExecutionPlanId,
} from "../../shared/identifiers";

import type { TreasuryExecutionPlan } from "../contracts";

import { loadTreasuryExecutionPlanWithClient } from "../persistence/loadTreasuryExecutionPlanWithClient";

import { persistTreasuryExecutionPlanTransitionWithClient } from "../persistence/persistTreasuryExecutionPlanTransitionWithClient";

import type { PersistedTreasuryExecutionPlanTransition } from "../persistence/contracts";

export async function executeDurableTreasuryExecutionPlanTransitionWithClient<
  TPayload,
>(params: {
  planId: TreasuryExecutionPlanId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  apply: (
    aggregate: TreasuryExecutionPlan,
  ) => TreasuryDomainResult<TreasuryExecutionPlan, TPayload>;

  client: TransactionClient;
}): Promise<PersistedTreasuryExecutionPlanTransition<TPayload>> {
  const { planId, eventId, context, apply, client } = params;

  const loaded = await loadTreasuryExecutionPlanWithClient({
    planId,

    client,
  });

  if (!loaded) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_PLAN_NOT_FOUND] ${planId}`);
  }

  const result = apply(loaded.aggregate);

  return persistTreasuryExecutionPlanTransitionWithClient({
    expectedVersion: loaded.aggregate.metadata.version,

    result,

    eventId,

    context,

    client,
  });
}
