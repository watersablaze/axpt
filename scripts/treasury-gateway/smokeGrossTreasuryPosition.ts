import assert from "node:assert/strict";

import { deriveGrossTreasuryPosition } from "../../src/domains/treasury/gateway/capital-position/deriveGrossTreasuryPosition";

import type { RecognizedCapitalPosition } from "../../src/domains/treasury/gateway/capital-receipts/recognizedCapitalPosition";

import type { ConfirmedOutboundCapitalPosition } from "../../src/domains/treasury/gateway/executions/confirmedOutboundCapitalPosition";

const programAccountId = "program-account-gross-position-smoke";

const otherProgramAccountId =
  "program-account-gross-position-smoke-other";

const currency = "USDT";

function recognized(
  amount: string,
  params?: {
    programAccountId?: string;
    currency?: string;
    receiptIds?: readonly string[];
  },
): RecognizedCapitalPosition {
  const positionCurrency = params?.currency ?? currency;

  return {
    programAccountId:
      params?.programAccountId ?? programAccountId,

    currency: positionCurrency,

    recognizedAmount: {
      amount,

      currency: positionCurrency,
    },

    contributingReceiptIds:
      params?.receiptIds ?? ["receipt-gross-position-smoke"],
  };
}

function outbound(
  amount: string,
  params?: {
    programAccountId?: string;
    currency?: string;
    executionIds?: readonly string[];
  },
): ConfirmedOutboundCapitalPosition {
  const positionCurrency = params?.currency ?? currency;

  return {
    programAccountId:
      params?.programAccountId ?? programAccountId,

    currency: positionCurrency,

    confirmedOutboundAmount: {
      amount,

      currency: positionCurrency,
    },

    contributingExecutionIds:
      params?.executionIds ?? ["execution-gross-position-smoke"],
  };
}

function derive(params: {
  recognizedAmount: string;
  outboundAmount: string;
}) {
  return deriveGrossTreasuryPosition({
    programAccountId,

    currency,

    recognizedPosition: recognized(
      params.recognizedAmount,
    ),

    confirmedOutboundPosition: outbound(
      params.outboundAmount,
    ),
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
   * No recognized inbound and no realized outbound.
   */
  const empty = derive({
    recognizedAmount: "0",

    outboundAmount: "0",
  });

  assertAmount(
    empty.grossAmount.amount,
    "0",
    "empty gross position",
  );

  /*
   * Recognition alone establishes gross Treasury position.
   */
  const recognizedOnly = derive({
    recognizedAmount: "599980.00",

    outboundAmount: "0",
  });

  assertAmount(
    recognizedOnly.grossAmount.amount,
    "599980",
    "recognized capital without outbound movement",
  );

  /*
   * First realized outbound movement.
   *
   * 599,980 - 25,000 = 574,980.
   */
  const afterFirstOutbound = derive({
    recognizedAmount: "599980.00",

    outboundAmount: "25000.00",
  });

  assertAmount(
    afterFirstOutbound.grossAmount.amount,
    "574980",
    "after first confirmed outbound movement",
  );

  /*
   * Additional realized movement.
   *
   * 599,980 - 75,000 = 524,980.
   */
  const afterAdditionalOutbound = derive({
    recognizedAmount: "599980.00",

    outboundAmount: "75000.00",
  });

  assertAmount(
    afterAdditionalOutbound.grossAmount.amount,
    "524980",
    "after additional confirmed outbound movement",
  );

  /*
   * Exact exhaustion is valid.
   */
  const exhausted = derive({
    recognizedAmount: "75000",

    outboundAmount: "75000.00",
  });

  assertAmount(
    exhausted.grossAmount.amount,
    "0",
    "exactly exhausted gross position",
  );

  /*
   * Gross retains the component financial facts.
   */
  const provenance = deriveGrossTreasuryPosition({
    programAccountId,

    currency,

    recognizedPosition: recognized(
      "599980",
      {
        receiptIds: [
          "receipt-a",
          "receipt-b",
        ],
      },
    ),

    confirmedOutboundPosition: outbound(
      "75000",
      {
        executionIds: [
          "execution-a",
          "execution-b",
        ],
      },
    ),
  });

  assertAmount(
    provenance.recognizedAmount.amount,
    "599980",
    "recognized component",
  );

  assertAmount(
    provenance.confirmedOutboundAmount.amount,
    "75000",
    "confirmed outbound component",
  );

  assert.deepEqual(
    provenance.contributingReceiptIds,
    ["receipt-a", "receipt-b"],
  );

  assert.deepEqual(
    provenance.contributingExecutionIds,
    ["execution-a", "execution-b"],
  );

  /*
   * Realized outbound cannot exceed recognized capital.
   *
   * This is a Treasury-fact contradiction, not merely a
   * decimal subtraction problem.
   */
  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: recognized("50000"),

        confirmedOutboundPosition: outbound("75000"),
      }),
    "GROSS_TREASURY_POSITION_OUTBOUND_EXCEEDS_RECOGNIZED",
  );

  /*
   * Recognized position must belong to the requested account.
   */
  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: recognized(
          "100000",
          {
            programAccountId:
              otherProgramAccountId,
          },
        ),

        confirmedOutboundPosition: outbound("0"),
      }),
    "GROSS_TREASURY_POSITION_RECOGNIZED_PROGRAM_ACCOUNT_MISMATCH",
  );

  /*
   * Outbound position must belong to the requested account.
   */
  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: recognized("100000"),

        confirmedOutboundPosition: outbound(
          "10000",
          {
            programAccountId:
              otherProgramAccountId,
          },
        ),
      }),
    "GROSS_TREASURY_POSITION_OUTBOUND_PROGRAM_ACCOUNT_MISMATCH",
  );

  /*
   * Recognized currency must agree with the projection currency.
   */
  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: recognized(
          "100000",
          {
            currency: "USD",
          },
        ),

        confirmedOutboundPosition: outbound("0"),
      }),
    "GROSS_TREASURY_POSITION_RECOGNIZED_CURRENCY_MISMATCH",
  );

  /*
   * Outbound currency must agree with the projection currency.
   */
  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: recognized("100000"),

        confirmedOutboundPosition: outbound(
          "10000",
          {
            currency: "USD",
          },
        ),
      }),
    "GROSS_TREASURY_POSITION_OUTBOUND_CURRENCY_MISMATCH",
  );

  /*
   * Also prove that the inner TreasuryMoney currency cannot
   * contradict the outer position currency.
   */
  const corruptRecognized = recognized("100000");

  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: {
          ...corruptRecognized,

          recognizedAmount: {
            amount:
              corruptRecognized.recognizedAmount.amount,

            currency: "USD",
          },
        },

        confirmedOutboundPosition: outbound("0"),
      }),
    "GROSS_TREASURY_POSITION_RECOGNIZED_CURRENCY_MISMATCH",
  );

  const corruptOutbound = outbound("10000");

  assertErrorCode(
    () =>
      deriveGrossTreasuryPosition({
        programAccountId,

        currency,

        recognizedPosition: recognized("100000"),

        confirmedOutboundPosition: {
          ...corruptOutbound,

          confirmedOutboundAmount: {
            amount:
              corruptOutbound.confirmedOutboundAmount.amount,

            currency: "USD",
          },
        },
      }),
    "GROSS_TREASURY_POSITION_OUTBOUND_CURRENCY_MISMATCH",
  );

  console.log(
    "✓ Treasury Gateway gross Treasury position smoke test passed",
  );

  console.log({
    empty: empty.grossAmount.amount,

    recognizedOnly:
      recognizedOnly.grossAmount.amount,

    afterFirstOutbound:
      afterFirstOutbound.grossAmount.amount,

    afterAdditionalOutbound:
      afterAdditionalOutbound.grossAmount.amount,

    exhausted: exhausted.grossAmount.amount,

    provenance: {
      recognizedAmount:
        provenance.recognizedAmount.amount,

      confirmedOutboundAmount:
        provenance.confirmedOutboundAmount.amount,

      receiptIds:
        provenance.contributingReceiptIds,

      executionIds:
        provenance.contributingExecutionIds,
    },

    integrity: {
      outboundExceedsRecognizedRejected: true,

      recognizedAccountMismatchRejected: true,

      outboundAccountMismatchRejected: true,

      recognizedCurrencyMismatchRejected: true,

      outboundCurrencyMismatchRejected: true,

      innerMoneyCurrencyMismatchRejected: true,
    },
  });
}

main();
