import { TREASURY_ALLOCATION_STATUS } from "./status";

import { assertTreasuryAllocationTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { compareDecimals, subtractDecimals } from "../shared/decimalAmount";

import type { TreasuryAllocation } from "./contracts";

import type { ReleaseTreasuryAllocation } from "./commands";

import type { TreasuryAllocationReleasedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function releaseTreasuryAllocation(
  aggregate: TreasuryAllocation,
  command: ReleaseTreasuryAllocation,
): TreasuryDomainResult<TreasuryAllocation, TreasuryAllocationReleasedPayload> {
  if (command.payload.allocationId !== aggregate.id) {
    throw new Error(
      `[TREASURY_ALLOCATION_COMMAND_TARGET_MISMATCH] ${command.payload.allocationId} -> ${aggregate.id}`,
    );
  }

  const remainingAmount = subtractDecimals(
    aggregate.amount.amount,
    aggregate.consumedAmount.amount,
  );

  if (compareDecimals(remainingAmount, "0") === 0) {
    throw new Error("[TREASURY_ALLOCATION_NO_REMAINING_CAPITAL_TO_RELEASE]");
  }

  const to = TREASURY_ALLOCATION_STATUS.RELEASED;

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_RELEASED,

      payload: {
        allocationId: aggregate.id,

        releasedAmount: {
          amount: remainingAmount,

          currency: aggregate.amount.currency,
        },

        totalConsumedAmount: aggregate.consumedAmount,

        reason: command.payload.reason,

        releasedAt: now,
      },

      occurredAt: now,
    },
  };
}
