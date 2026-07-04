import assert from "node:assert/strict";

import { consumeTreasuryAllocation } from "../../src/domains/treasury/gateway/allocations/consumeTreasuryAllocation";

import { releaseTreasuryAllocation } from "../../src/domains/treasury/gateway/allocations/releaseTreasuryAllocation";

import { TREASURY_ALLOCATION_STATUS } from "../../src/domains/treasury/gateway/allocations/status";

import type { TreasuryAllocation } from "../../src/domains/treasury/gateway/allocations/contracts";

import type {
  ConsumeTreasuryAllocation,
  ReleaseTreasuryAllocation,
} from "../../src/domains/treasury/gateway/allocations/commands";

function makeAllocation(): TreasuryAllocation {
  return {
    id: "allocation-1",

    reference: "ALLOC-001",

    programId: "program-1",

    sourceProgramAccountId: "account-1",

    purposeType: "PROGRAM_OPERATIONS",

    amount: {
      amount: "100",

      currency: "USD",
    },

    consumedAmount: {
      amount: "0",

      currency: "USD",
    },

    status: TREASURY_ALLOCATION_STATUS.ACTIVE,

    activatedAt: new Date("2026-07-04T00:00:00.000Z"),

    metadata: {
      createdAt: new Date("2026-07-04T00:00:00.000Z"),

      updatedAt: new Date("2026-07-04T00:00:00.000Z"),

      createdByActorId: "actor-1",

      lastModifiedByActorId: "actor-1",

      version: 1,
    },
  };
}

function makeConsumeCommand(
  amount: string,
  currency = "USD",
): ConsumeTreasuryAllocation {
  return {
    context: {
      commandId: `command-consume-${amount}`,

      actorId: "actor-2",

      correlationId: "correlation-1",

      requestedAt: new Date("2026-07-04T01:00:00.000Z"),

      idempotencyKey: `consume-${amount}-${currency}`,
    },

    payload: {
      allocationId: "allocation-1",

      amount: {
        amount,

        currency,
      },

      consumingSubjectType: "TREASURY_EXECUTION",

      consumingSubjectId: "execution-1",
    },
  };
}

function makeReleaseCommand(): ReleaseTreasuryAllocation {
  return {
    context: {
      commandId: "command-release-1",

      actorId: "actor-2",

      correlationId: "correlation-1",

      requestedAt: new Date("2026-07-04T02:00:00.000Z"),

      idempotencyKey: "release-1",
    },

    payload: {
      allocationId: "allocation-1",

      reason: "Unused capital released",
    },
  };
}

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const initial = makeAllocation();

const first = consumeTreasuryAllocation(initial, makeConsumeCommand("20"));

assert.equal(
  first.aggregate.status,
  TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED,
);

assert.equal(first.aggregate.consumedAmount.amount, "20");

assert.equal(first.event.payload.remainingAmount.amount, "80");

const second = consumeTreasuryAllocation(
  first.aggregate,
  makeConsumeCommand("30"),
);

assert.equal(
  second.aggregate.status,
  TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED,
);

assert.equal(second.aggregate.consumedAmount.amount, "50");

assert.equal(second.event.payload.remainingAmount.amount, "50");

const final = consumeTreasuryAllocation(
  second.aggregate,
  makeConsumeCommand("50"),
);

assert.equal(final.aggregate.status, TREASURY_ALLOCATION_STATUS.CONSUMED);

assert.equal(final.aggregate.consumedAmount.amount, "100");

assert.equal(final.event.payload.remainingAmount.amount, "0");

assertThrowsWithCode(
  () => consumeTreasuryAllocation(makeAllocation(), makeConsumeCommand("0")),
  "TREASURY_DECIMAL_NOT_POSITIVE",
);

assertThrowsWithCode(
  () => consumeTreasuryAllocation(makeAllocation(), makeConsumeCommand("101")),
  "TREASURY_ALLOCATION_CONSUMPTION_EXCEEDS_ALLOCATION",
);

assertThrowsWithCode(
  () =>
    consumeTreasuryAllocation(
      makeAllocation(),
      makeConsumeCommand("10", "EUR"),
    ),
  "TREASURY_ALLOCATION_CURRENCY_MISMATCH",
);

const partial = consumeTreasuryAllocation(
  makeAllocation(),
  makeConsumeCommand("25"),
);

const released = releaseTreasuryAllocation(
  partial.aggregate,
  makeReleaseCommand(),
);

assert.equal(released.aggregate.status, TREASURY_ALLOCATION_STATUS.RELEASED);

assert.equal(released.event.payload.releasedAmount.amount, "75");

assert.equal(released.event.payload.totalConsumedAmount.amount, "25");

assertThrowsWithCode(
  () => releaseTreasuryAllocation(final.aggregate, makeReleaseCommand()),
  "TREASURY_ALLOCATION_NO_REMAINING_CAPITAL_TO_RELEASE",
);

console.log("✓ Treasury allocation consumption verification passed");
