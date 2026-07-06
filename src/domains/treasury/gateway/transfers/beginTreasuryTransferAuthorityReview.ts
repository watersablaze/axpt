import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { assertTreasuryTransferTransition } from "./assertTransition";

import { TREASURY_TRANSFER_STATUS } from "./status";

import type { BeginTreasuryTransferAuthorityReview } from "./commands";

import type { TreasuryTransfer } from "./contracts";

import type { TreasuryTransferAuthorityReviewStartedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function beginTreasuryTransferAuthorityReview(
  aggregate: TreasuryTransfer,

  command: BeginTreasuryTransferAuthorityReview,
): TreasuryDomainResult<
  TreasuryTransfer,
  TreasuryTransferAuthorityReviewStartedPayload
> {
  if (command.payload.transferId !== aggregate.id) {
    throw new Error(
      `[TREASURY_TRANSFER_COMMAND_TARGET_MISMATCH] ${command.payload.transferId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW;

  assertTreasuryTransferTransition(
    aggregate.status,

    to,
  );

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_REVIEW_STARTED,

      payload: {
        transferId: aggregate.id,
      },

      occurredAt: now,
    },
  };
}
