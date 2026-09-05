import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryAllocationId,
  TreasuryEventId,
} from "../../shared/identifiers";

import { activateTreasuryAllocation } from "../activateTreasuryAllocation";

import type { TreasuryAllocationActivatedPayload } from "../events";

import type { PersistedTreasuryAllocationTransition } from "../persistence/contracts";

import { executeDurableTreasuryAllocationTransitionWithClient } from "./executeDurableTreasuryAllocationTransitionWithClient";

export async function activateTreasuryAllocationDurablyWithClient(params: {
  allocationId: TreasuryAllocationId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryAllocationTransition<TreasuryAllocationActivatedPayload>
> {
  const { allocationId, eventId, context, client } = params;

  return executeDurableTreasuryAllocationTransitionWithClient({
    allocationId,

    eventId,

    context,

    apply: (aggregate) =>
      activateTreasuryAllocation(aggregate, {
        context,

        payload: {
          allocationId,
        },
      }),

    client,
  });
}
