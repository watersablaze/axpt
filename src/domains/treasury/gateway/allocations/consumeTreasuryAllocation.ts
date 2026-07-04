import { TREASURY_ALLOCATION_STATUS } from "./status";

import { assertTreasuryAllocationTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import {
  addDecimals,
  assertPositiveDecimal,
  compareDecimals,
  subtractDecimals,
} from "../shared/decimalAmount";

import type { TreasuryAllocation } from "./contracts";

import type { ConsumeTreasuryAllocation } from "./commands";

import type { TreasuryAllocationConsumedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function consumeTreasuryAllocation(
  aggregate: TreasuryAllocation,
  command: ConsumeTreasuryAllocation,
): TreasuryDomainResult<TreasuryAllocation, TreasuryAllocationConsumedPayload> {
  if (command.payload.allocationId !== aggregate.id) {
    throw new Error(
      `[TREASURY_ALLOCATION_COMMAND_TARGET_MISMATCH] ${command.payload.allocationId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.amount.currency !== aggregate.amount.currency) {
    throw new Error(
      `[TREASURY_ALLOCATION_CURRENCY_MISMATCH] ${command.payload.amount.currency} -> ${aggregate.amount.currency}`,
    );
  }

  assertPositiveDecimal(command.payload.amount.amount);

  const nextConsumedAmount = addDecimals(
    aggregate.consumedAmount.amount,
    command.payload.amount.amount,
  );

  if (compareDecimals(nextConsumedAmount, aggregate.amount.amount) > 0) {
    throw new Error("[TREASURY_ALLOCATION_CONSUMPTION_EXCEEDS_ALLOCATION]");
  }

  const isFullyConsumed =
    compareDecimals(nextConsumedAmount, aggregate.amount.amount) === 0;

  const to = isFullyConsumed
    ? TREASURY_ALLOCATION_STATUS.CONSUMED
    : TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED;

  assertTreasuryAllocationTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  const remainingAmount = subtractDecimals(
    aggregate.amount.amount,
    nextConsumedAmount,
  );

  return {
    aggregate: {
      ...aggregate,

      consumedAmount: {
        amount: nextConsumedAmount,

        currency: aggregate.amount.currency,
      },

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CONSUMED,

      payload: {
        allocationId: aggregate.id,

        consumedAmount: command.payload.amount,

        totalConsumedAmount: {
          amount: nextConsumedAmount,

          currency: aggregate.amount.currency,
        },

        remainingAmount: {
          amount: remainingAmount,

          currency: aggregate.amount.currency,
        },

        consumingSubjectType: command.payload.consumingSubjectType,

        consumingSubjectId: command.payload.consumingSubjectId,
      },

      occurredAt: now,
    },
  };
}
