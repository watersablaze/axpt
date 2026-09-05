import assert from "node:assert/strict";

import { deriveAvailableCapitalPosition } from "../../src/domains/treasury/gateway/capital-position/deriveAvailableCapitalPosition";

import type { GrossTreasuryPosition } from "../../src/domains/treasury/gateway/capital-position/grossTreasuryPosition";

import type { CommittedCapitalPosition } from "../../src/domains/treasury/gateway/allocations/committedCapitalPosition";

const programAccountId =
  "program-account-available-position-smoke";

const otherProgramAccountId =
  "program-account-available-position-smoke-other";

const currency = "USDT";

function gross(
  amount: string,
  params?: {
    programAccountId?: string;
    currency?: string;
    recognizedAmount?: string;
    confirmedOutboundAmount?: string;
    receiptIds?: readonly string[];
    executionIds?: readonly string[];
  },
): GrossTreasuryPosition {
  const positionCurrency = params?.currency ?? currency;

  return {
    programAccountId:
      params?.programAccountId ?? programAccountId,

    currency: positionCurrency,

    grossAmount: {
      amount,

      currency: positionCurrency,
    },

    recognizedAmount: {
      amount: params?.recognizedAmount ?? amount,

      currency: positionCurrency,
    },

    confirmedOutboundAmount: {
      amount: params?.confirmedOutboundAmount ?? "0",

      currency: positionCurrency,
    },

    contributingReceiptIds:
      params?.receiptIds ?? ["receipt-available-smoke"],

    contributingExecutionIds:
      params?.executionIds ?? [],
  };
}

function committed(
  amount: string,
  params?: {
    programAccountId?: string;
    currency?: string;
    allocationIds?: readonly string[];
  },
): CommittedCapitalPosition {
  const positionCurrency = params?.currency ?? currency;

  return {
    programAccountId:
      params?.programAccountId ?? programAccountId,

    currency: positionCurrency,

    committedAmount: {
      amount,

      currency: positionCurrency,
    },

    contributingAllocationIds:
      params?.allocationIds ?? ["allocation-available-smoke"],
  };
}

function derive(params: {
  grossAmount: string;
  committedAmount: string;
}) {
  return deriveAvailableCapitalPosition({
    programAccountId,

    currency,

    grossPosition: gross(params.grossAmount),

    committedPosition: committed(params.committedAmount),
  });
}

function assertAmount(
  actual: string,
  expected: string,
  label: string,
): void {
  assert.equal(
    actual,
    expected,
    `${label}: expected ${expected}, received ${actual}`,
  );
}

function assertErrorCode(
  operation: () => unknown,
  code: string,
): void {
  let received: unknown;

  try {
    operation();
  } catch (error: unknown) {
    received = error;
  }

  assert(received instanceof Error);

  assert(
    received.message.includes(code),
    `Expected ${code}, received ${received.message}`,
  );
}

function main(): void {
  /*
   * No commitment: all gross capital is available.
   */
  const uncommitted = derive({
    grossAmount: "100000.00",

    committedAmount: "0",
  });

  assertAmount(
    uncommitted.availableAmount.amount,
    "100000",
    "fully uncommitted capital",
  );

  /*
   * Exact commitment: no capital remains available.
   */
  const fullyCommitted = derive({
    grossAmount: "100000",

    committedAmount: "100000.00",
  });

  assertAmount(
    fullyCommitted.availableAmount.amount,
    "0",
    "fully committed capital",
  );

  /*
   * Core accounting invariant.
   *
   * Stage 1:
   * recognized 599,980
   * outbound          0
   * gross       599,980
   * committed    75,000
   * available   524,980
   */
  const beforeExecution =
    deriveAvailableCapitalPosition({
      programAccountId,

      currency,

      grossPosition: gross(
        "599980",
        {
          recognizedAmount: "599980",

          confirmedOutboundAmount: "0",

          receiptIds: ["receipt-a"],
        },
      ),

      committedPosition: committed(
        "75000",
        {
          allocationIds: ["allocation-a"],
        },
      ),
    });

  assertAmount(
    beforeExecution.availableAmount.amount,
    "524980",
    "available before execution",
  );

  /*
   * Stage 2:
   * 25,000 of the committed allocation has executed.
   *
   * gross decreases by realized outbound movement.
   * commitment decreases by the utilized authority.
   *
   * Availability therefore remains unchanged.
   */
  const afterPartialExecution =
    deriveAvailableCapitalPosition({
      programAccountId,

      currency,

      grossPosition: gross(
        "574980",
        {
          recognizedAmount: "599980",

          confirmedOutboundAmount: "25000",

          receiptIds: ["receipt-a"],

          executionIds: ["execution-a1"],
        },
      ),

      committedPosition: committed(
        "50000",
        {
          allocationIds: ["allocation-a"],
        },
      ),
    });

  assertAmount(
    afterPartialExecution.availableAmount.amount,
    "524980",
    "available after partial execution",
  );

  /*
   * Stage 3:
   * the entire 75,000 allocation has executed.
   *
   * The commitment is gone because its authority was consumed.
   * Gross has fallen by the full realized movement.
   *
   * The capital does NOT return to availability.
   */
  const afterFullExecution =
    deriveAvailableCapitalPosition({
      programAccountId,

      currency,

      grossPosition: gross(
        "524980",
        {
          recognizedAmount: "599980",

          confirmedOutboundAmount: "75000",

          receiptIds: ["receipt-a"],

          executionIds: [
            "execution-a1",
            "execution-a2",
          ],
        },
      ),

      committedPosition: committed(
        "0",
        {
          allocationIds: [],
        },
      ),
    });

  assertAmount(
    afterFullExecution.availableAmount.amount,
    "524980",
    "available after full execution",
  );

  assert.equal(
    beforeExecution.availableAmount.amount,
    afterPartialExecution.availableAmount.amount,
  );

  assert.equal(
    afterPartialExecution.availableAmount.amount,
    afterFullExecution.availableAmount.amount,
  );

  /*
   * Available position preserves the component amounts
   * and complete financial-fact provenance.
   */
  const provenance =
    deriveAvailableCapitalPosition({
      programAccountId,

      currency,

      grossPosition: gross(
        "574980",
        {
          recognizedAmount: "599980",

          confirmedOutboundAmount: "25000",

          receiptIds: [
            "receipt-a",
            "receipt-b",
          ],

          executionIds: [
            "execution-a",
            "execution-b",
          ],
        },
      ),

      committedPosition: committed(
        "50000",
        {
          allocationIds: [
            "allocation-a",
            "allocation-b",
          ],
        },
      ),
    });

  assertAmount(
    provenance.grossAmount.amount,
    "574980",
    "gross component",
  );

  assertAmount(
    provenance.committedAmount.amount,
    "50000",
    "committed component",
  );

  assert.deepEqual(
    provenance.contributingReceiptIds,
    ["receipt-a", "receipt-b"],
  );

  assert.deepEqual(
    provenance.contributingExecutionIds,
    ["execution-a", "execution-b"],
  );

  assert.deepEqual(
    provenance.contributingAllocationIds,
    ["allocation-a", "allocation-b"],
  );

  /*
   * Commitment cannot exceed Gross.
   *
   * This is a Treasury-position contradiction rather than
   * merely an arithmetic underflow.
   */
  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: gross("100000"),

        committedPosition: committed("100001"),
      }),
    "AVAILABLE_CAPITAL_POSITION_COMMITTED_EXCEEDS_GROSS",
  );

  /*
   * Both component projections must belong to the requested
   * Program Account.
   */
  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: gross(
          "100000",
          {
            programAccountId:
              otherProgramAccountId,
          },
        ),

        committedPosition: committed("0"),
      }),
    "AVAILABLE_CAPITAL_POSITION_GROSS_PROGRAM_ACCOUNT_MISMATCH",
  );

  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: gross("100000"),

        committedPosition: committed(
          "10000",
          {
            programAccountId:
              otherProgramAccountId,
          },
        ),
      }),
    "AVAILABLE_CAPITAL_POSITION_COMMITTED_PROGRAM_ACCOUNT_MISMATCH",
  );

  /*
   * Both component projections must agree with the requested
   * currency.
   */
  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: gross(
          "100000",
          {
            currency: "USD",
          },
        ),

        committedPosition: committed("0"),
      }),
    "AVAILABLE_CAPITAL_POSITION_GROSS_CURRENCY_MISMATCH",
  );

  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: gross("100000"),

        committedPosition: committed(
          "10000",
          {
            currency: "USD",
          },
        ),
      }),
    "AVAILABLE_CAPITAL_POSITION_COMMITTED_CURRENCY_MISMATCH",
  );

  /*
   * Inner TreasuryMoney currencies may not contradict their
   * outer position currency.
   */
  const corruptGross = gross("100000");

  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: {
          ...corruptGross,

          grossAmount: {
            amount: corruptGross.grossAmount.amount,

            currency: "USD",
          },
        },

        committedPosition: committed("0"),
      }),
    "AVAILABLE_CAPITAL_POSITION_GROSS_CURRENCY_MISMATCH",
  );

  const corruptCommitted = committed("10000");

  assertErrorCode(
    () =>
      deriveAvailableCapitalPosition({
        programAccountId,

        currency,

        grossPosition: gross("100000"),

        committedPosition: {
          ...corruptCommitted,

          committedAmount: {
            amount:
              corruptCommitted.committedAmount.amount,

            currency: "USD",
          },
        },
      }),
    "AVAILABLE_CAPITAL_POSITION_COMMITTED_CURRENCY_MISMATCH",
  );

  console.log(
    "✓ Treasury Gateway available capital position smoke test passed",
  );

  console.log({
    boundaries: {
      uncommitted:
        uncommitted.availableAmount.amount,

      fullyCommitted:
        fullyCommitted.availableAmount.amount,
    },

    executionInvariant: {
      beforeExecution:
        beforeExecution.availableAmount.amount,

      afterPartialExecution:
        afterPartialExecution.availableAmount.amount,

      afterFullExecution:
        afterFullExecution.availableAmount.amount,
    },

    provenance: {
      grossAmount:
        provenance.grossAmount.amount,

      committedAmount:
        provenance.committedAmount.amount,

      receiptIds:
        provenance.contributingReceiptIds,

      executionIds:
        provenance.contributingExecutionIds,

      allocationIds:
        provenance.contributingAllocationIds,
    },

    integrity: {
      committedExceedsGrossRejected: true,

      grossAccountMismatchRejected: true,

      committedAccountMismatchRejected: true,

      grossCurrencyMismatchRejected: true,

      committedCurrencyMismatchRejected: true,

      innerMoneyCurrencyMismatchRejected: true,
    },
  });
}

main();
