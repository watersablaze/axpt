import type { TransactionClient } from "@prisma/client";

import type {
  TreasuryAllocationId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryAllocationReviewStartedPayload } from "../events";

import { submitTreasuryAllocationForReview } from "../submitTreasuryAllocationForReview";

import type { PersistedTreasuryAllocationTransition } from "../persistence/contracts";

import { executeDurableTreasuryAllocationTransitionWithClient } from "./executeDurableTreasuryAllocationTransitionWithClient";

export async function submitTreasuryAllocationForReviewDurablyWithClient(
  params: {
    allocationId: TreasuryAllocationId;

    eventId: TreasuryEventId;

    context: TreasuryCommandContext;

    client: TransactionClient;
  },
): Promise<
  PersistedTreasuryAllocationTransition<TreasuryAllocationReviewStartedPayload>
> {
  const { allocationId, eventId, context, client } = params;

  return executeDurableTreasuryAllocationTransitionWithClient({
    allocationId,

    eventId,

    context,

    apply: (aggregate) =>
      submitTreasuryAllocationForReview(aggregate, {
        context,

        payload: {
          allocationId,
        },
      }),

    client,
  });
}
