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
    amount: "2550",

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

  assetCode: "USD",

  amountBaseUnits: "2550",

  verifiedAt: new Date("2026-09-14T05:30:00.000Z"),
};

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

        assetCode: "",
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_ASSET_REQUIRED",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        amountBaseUnits: "",
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

        assetCode: "EUR",
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_ASSET_MISMATCH",
);

assertThrowsWithCode(
  () =>
    assertVerifiedTreasuryExecutionSettlementMatchesExecution({
      settlement: {
        ...validSettlement,

        amountBaseUnits: "2549",
      },

      execution,
    }),
  "TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_MISMATCH",
);

console.log(
  "✓ Verified Treasury execution settlement boundary verification passed",
);
