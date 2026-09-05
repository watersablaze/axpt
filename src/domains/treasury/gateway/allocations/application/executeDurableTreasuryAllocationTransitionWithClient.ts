import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";
import type { TreasuryDomainResult } from "../../shared/domainResult";

import type {
  TreasuryAllocationId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { TreasuryAllocation } from "../contracts";

import type { PersistedTreasuryAllocationTransition } from "../persistence/contracts";

import { loadTreasuryAllocationWithClient } from "../persistence/loadTreasuryAllocationWithClient";

import { persistTreasuryAllocationTransitionWithClient } from "../persistence/persistTreasuryAllocationTransitionWithClient";

export async function executeDurableTreasuryAllocationTransitionWithClient<
  TPayload,
>(params: {
  allocationId: TreasuryAllocationId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  apply: (
    aggregate: TreasuryAllocation,
  ) => TreasuryDomainResult<TreasuryAllocation, TPayload>;

  client: TransactionClient;
}): Promise<PersistedTreasuryAllocationTransition<TPayload>> {
  const { allocationId, eventId, context, apply, client } = params;

  const loaded = await loadTreasuryAllocationWithClient({
    allocationId,

    client,
  });

  if (!loaded) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_NOT_FOUND] ${allocationId}`,
    );
  }

  const result = apply(loaded.aggregate);

  return persistTreasuryAllocationTransitionWithClient({
    expectedVersion: loaded.aggregate.metadata.version,

    result,

    eventId,

    context,

    client,
  });
}
