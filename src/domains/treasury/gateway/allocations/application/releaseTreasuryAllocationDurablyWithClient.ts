import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryAllocationId,
  TreasuryEventId,
} from "../../shared/identifiers";

import { releaseTreasuryAllocation } from "../releaseTreasuryAllocation";

import type { TreasuryAllocationReleasedPayload } from "../events";

import type { PersistedTreasuryAllocationTransition } from "../persistence/contracts";

import { executeDurableTreasuryAllocationTransitionWithClient } from "./executeDurableTreasuryAllocationTransitionWithClient";

export async function releaseTreasuryAllocationDurablyWithClient(params: {
  allocationId: TreasuryAllocationId;

  reason: string;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryAllocationTransition<TreasuryAllocationReleasedPayload>
> {
  const {
    allocationId,
    reason,
    eventId,
    context,
    client,
  } = params;

  return executeDurableTreasuryAllocationTransitionWithClient({
    allocationId,

    eventId,

    context,

    apply: (aggregate) =>
      releaseTreasuryAllocation(aggregate, {
        context,

        payload: {
          allocationId,

          reason,
        },
      }),

    client,
  });
}
