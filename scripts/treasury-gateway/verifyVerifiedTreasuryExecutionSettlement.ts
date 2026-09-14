import assert from "node:assert/strict";

import { assertVerifiedTreasuryExecutionSettlementMatchesExecution } from "../../src/domains/treasury/gateway/executions/assertVerifiedTreasuryExecutionSettlementMatchesExecution";

import type { TreasuryExecution } from "../../src/domains/treasury/gateway/executions/contracts";

import type { VerifiedTreasuryExecutionSettlement } from "../../src/domains/treasury/gateway/executions/verifiedSettlementContracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const execution: TreasuryExecution = {
  id: "execution-er1c-001",

  reference: "EXEC-ER1C-001",

  programId: "program-er1c-001",

  allocationId: "allocation-er1c-001",

  instructionId: "instruction-er1c-001",

  kind: "PROGRAM_TRANSFER",

  beneficiaryProfileId: "beneficiary-er1c-001",

  settlementEndpointId: "endpoint-er1c-001",

  amount: {
    amount: "25.50",

    currency: "USD",
  },

  purpose: "ER-1C verified settlement boundary",

  status: TREASURY_EXECUTION_STATUS.INITIATED,

  validatedAt: new Date("2026-09-14T05:00:00.000Z"),

  authorizedAt: new Date("2026-09-14T05:10:00.000Z"),

  metadata: {
    createdAt: new Date("2026-09-14T04:00:00.000Z"),

    updatedAt: new Date("2026-09-14T05:20:00.000Z"),

    createdByActorId: "actor-er1c-001",

    lastModifiedByActorId: "actor-er1c-002",

    version: 6,
  },
};

const validSettlement: VerifiedTreasuryExecutionSettlement = {
  executionId: execution.id,

  amount: {
    amount: "25.5",

    currency: "USD",
  },

  verifiedAt: new Date("2026-09-14T05:30:00.000Z"),
};

/*
 * Representation-equivalent decimal strings must be accepted.
 */
assert.doesNotThrow(() =>
  assertVerifiedTreasuryExecutionSettlementMatchesExecution({
    settlement: validSettlement,

    execution,
  }),
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        executionId: "execution-other",
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_EXECUTION_MISMATCH",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        amount: {
          amount: validSettlement.amount.amount,

          currency: "",
        },
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_CURRENCY_REQUIRED",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        amount: {
          amount: "",

          currency: validSettlement.amount.currency,
        },
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_REQUIRED",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        verifiedAt: new Date("invalid"),
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_VERIFIED_AT_INVALID",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        amount: {
          amount: validSettlement.amount.amount,

          currency: "EUR",
        },
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_CURRENCY_MISMATCH",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        amount: {
          amount: "25.49",

          currency: "USD",
        },
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_MISMATCH",
);

console.log(
  "✓ Verified Treasury execution settlement boundary verification passed",
);
