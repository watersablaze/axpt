import { TREASURY_ALLOCATION_STATUS } from "./status";

import { assertTreasuryAllocationTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryAllocation } from "./contracts";

import type { SubmitTreasuryAllocationForReview } from "./commands";

import type { TreasuryAllocationReviewStartedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function submitTreasuryAllocationForReview(
  aggregate: TreasuryAllocation,
  command: SubmitTreasuryAllocationForReview,
): TreasuryDomainResult<
  TreasuryAllocation,
  TreasuryAllocationReviewStartedPayload
> {
  if (command.payload.allocationId !== aggregate.id) {
    throw new Error(
      `[TREASURY_ALLOCATION_COMMAND_TARGET_MISMATCH] ${command.payload.allocationId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_ALLOCATION_STATUS.UNDER_REVIEW;

  assertTreasuryAllocationTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_REVIEW_STARTED,

      payload: {
        allocationId: aggregate.id,
      },

      occurredAt: now,
    },
  };
}
