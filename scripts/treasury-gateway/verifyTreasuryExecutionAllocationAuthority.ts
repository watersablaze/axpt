import assert from "node:assert/strict";

import {
  TREASURY_ALLOCATION_PURPOSE,
  type TreasuryAllocation,
} from "../../src/domains/treasury/gateway/allocations/contracts";

import { TREASURY_ALLOCATION_STATUS } from "../../src/domains/treasury/gateway/allocations/status";

import type { TreasuryExecution } from "../../src/domains/treasury/gateway/executions/contracts";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { assertTreasuryExecutionAllocationAuthority } from "../../src/domains/treasury/gateway/execution-plans/assertTreasuryExecutionAllocationAuthority";

import {
  TREASURY_TRANSFER_LOCATION_KIND,
  type TreasuryTransfer,
} from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const now = new Date("2026-09-11T00:00:00.000Z");

function assertErrorCode(run: () => void, code: string): void {
  let error: unknown;

  try {
    run();
  } catch (caught: unknown) {
    error = caught;
  }

  assert(error instanceof Error);

  assert(
    error.message.includes(`[${code}]`),
    `expected ${code}, received: ${error.message}`,
  );
}

function makeTransfer(
  overrides: Partial<TreasuryTransfer> = {},
): TreasuryTransfer {
  return {
    id: "transfer-ep3a",
    reference: "TRANSFER-EP3A",
    programId: "program-ep3a",
    source: {
      kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,
      programAccountId: "program-account-ep3a",
    },
    destination: {
      kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,
      settlementEndpointId: "settlement-endpoint-ep3a",
    },
    requestedAmount: {
      amount: "1000",
      currency: "USD",
    },
    destinationCurrency: "EUR",
    purpose: "EP-3A allocation authority verification",
    status: TREASURY_TRANSFER_STATUS.PLANNED,
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdByActorId: "actor-ep3a",
      lastModifiedByActorId: "actor-ep3a",
      version: 4,
    },
    ...overrides,
  };
}

function makeAllocation(
  overrides: Partial<TreasuryAllocation> = {},
): TreasuryAllocation {
  return {
    id: "allocation-ep3a",
    reference: "ALLOCATION-EP3A",
    programId: "program-ep3a",
    sourceProgramAccountId: "program-account-ep3a",
    purposeType: TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,
    amount: {
      amount: "1000",
      currency: "USD",
    },
    consumedAmount: {
      amount: "0",
      currency: "USD",
    },
    status: TREASURY_ALLOCATION_STATUS.ACTIVE,
    activatedAt: now,
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdByActorId: "actor-ep3a",
      lastModifiedByActorId: "actor-ep3a",
      version: 4,
    },
    ...overrides,
  };
}

function makeExecution(
  overrides: Partial<TreasuryExecution> = {},
): TreasuryExecution {
  return {
    id: "execution-ep3a",
    reference: "EXECUTION-EP3A",
    programId: "program-ep3a",
    allocationId: "allocation-ep3a",
    kind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,
    settlementEndpointId: "settlement-endpoint-ep3a",
    amount: {
      amount: "500",
      currency: "USD",
    },
    purpose: "EP-3A allocation authority verification",
    status: TREASURY_EXECUTION_STATUS.CREATED,
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdByActorId: "actor-ep3a",
      lastModifiedByActorId: "actor-ep3a",
      version: 1,
    },
    ...overrides,
  };
}

/*
 * Canonical ACTIVE Allocation with sufficient remaining capital succeeds.
 */
assert.doesNotThrow(() =>
  assertTreasuryExecutionAllocationAuthority({
    allocation: makeAllocation(),
    transfer: makeTransfer(),
    execution: makeExecution(),
  }),
);

/*
 * PARTIALLY_CONSUMED remains usable when sufficient committed capital remains.
 */
assert.doesNotThrow(() =>
  assertTreasuryExecutionAllocationAuthority({
    allocation: makeAllocation({
      consumedAmount: {
        amount: "400",
        currency: "USD",
      },
      status: TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdByActorId: "actor-ep3a",
        lastModifiedByActorId: "actor-ep3a",
        version: 5,
      },
    }),
    transfer: makeTransfer(),
    execution: makeExecution({
      amount: {
        amount: "600",
        currency: "USD",
      },
    }),
  }),
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        id: "allocation-other",
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_ID_MISMATCH",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        programId: "program-foreign",
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_PROGRAM_MISMATCH",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation(),
      transfer: makeTransfer({
        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE,
          externalReference: "external-source",
        },
      }),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_TRANSFER_SOURCE_UNSUPPORTED",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        sourceProgramAccountId: "program-account-foreign",
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_SOURCE_ACCOUNT_MISMATCH",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        amount: {
          amount: "1000",
          currency: "EUR",
        },
        consumedAmount: {
          amount: "0",
          currency: "EUR",
        },
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_CURRENCY_MISMATCH",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        status: TREASURY_ALLOCATION_STATUS.APPROVED,
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_NOT_CONSUMABLE",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        consumedAmount: {
          amount: "600",
          currency: "USD",
        },
        status: TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED,
      }),
      transfer: makeTransfer(),
      execution: makeExecution({
        amount: {
          amount: "500",
          currency: "USD",
        },
      }),
    }),
  "TREASURY_EXECUTION_ALLOCATION_INSUFFICIENT_REMAINING_CAPITAL",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        consumedAmount: {
          amount: "1001",
          currency: "USD",
        },
        status: TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED,
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_CONSUMED_AMOUNT_INVALID",
);

assertErrorCode(
  () =>
    assertTreasuryExecutionAllocationAuthority({
      allocation: makeAllocation({
        consumedAmount: {
          amount: "0",
          currency: "EUR",
        },
      }),
      transfer: makeTransfer(),
      execution: makeExecution(),
    }),
  "TREASURY_EXECUTION_ALLOCATION_MONEY_CURRENCY_MISMATCH",
);

console.log("✓ Treasury Execution Allocation authority verification passed");

console.log({
  invariants: {
    activeAllocationAccepted: true,
    partiallyConsumedAllocationAcceptedWhenSufficient: true,
    allocationIdentityRequired: true,
    sameProgramRequired: true,
    programAccountSourceRequired: true,
    sameSourceProgramAccountRequired: true,
    sameCurrencyRequired: true,
    consumableLifecycleRequired: true,
    sufficientRemainingCapitalRequired: true,
    consumedAmountCannotExceedAllocation: true,
    allocationMoneyCurrencyIntegrityRequired: true,
  },
});
