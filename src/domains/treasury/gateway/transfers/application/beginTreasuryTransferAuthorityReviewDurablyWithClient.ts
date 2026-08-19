import type { TransactionClient } from "@prisma/client";

import { beginTreasuryTransferAuthorityReview } from "../beginTreasuryTransferAuthorityReview";

import { executeDurableTreasuryTransferTransitionWithClient } from "./executeDurableTreasuryTransferTransitionWithClient";

import type {
  TreasuryEventId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { PersistedTreasuryTransferTransition } from "../persistence/contracts";

import type { TreasuryTransferAuthorityReviewStartedPayload } from "../events";

export async function beginTreasuryTransferAuthorityReviewDurablyWithClient(params: {
  transferId: TreasuryTransferId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryTransferTransition<TreasuryTransferAuthorityReviewStartedPayload>
> {
  const { transferId, eventId, context, client } = params;

  return executeDurableTreasuryTransferTransitionWithClient({
    transferId,

    eventId,

    context,

    apply: (aggregate) =>
      beginTreasuryTransferAuthorityReview(aggregate, {
        context,

        payload: {
          transferId,
        },
      }),

    client,
  });
}
