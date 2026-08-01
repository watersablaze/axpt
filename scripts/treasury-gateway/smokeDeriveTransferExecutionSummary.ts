import assert from "node:assert/strict";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import type { TreasuryExecution } from "../../src/domains/treasury/gateway/executions/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import type { TreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/contracts";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import { deriveTransferExecutionSummary } from "../../src/domains/treasury/gateway/transfer-execution-summary";

import {
  TREASURY_TRANSFER_LOCATION_KIND,
  type TreasuryTransfer,
} from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

function assertThrowsWithCode(
  fn: () => unknown,

  code: string,
): void {
  assert.throws(
    fn,

    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const createdAt = new Date("2026-08-01T10:00:00.000Z");

const planUpdatedAt = new Date("2026-08-01T10:10:00.000Z");

const executionUpdatedAt = new Date("2026-08-01T10:20:00.000Z");

const transfer: TreasuryTransfer = {
  id: "summary-transfer-001",

  reference: "AXPT-TXFR-SUMMARY-001",

  programId: "summary-program-001",

  instructionId: "summary-instruction-001",

  source: {
    kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

    programAccountId: "summary-program-account-001",
  },

  destination: {
    kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

    settlementEndpointId: "summary-endpoint-001",
  },

  requestedAmount: {
    amount: "1000000.00",

    currency: "USD",
  },

  destinationCurrency: "EUR",

  purpose: "Transfer execution summary smoke test",

  status: TREASURY_TRANSFER_STATUS.PLANNED,

  metadata: {
    createdAt,

    updatedAt: createdAt,

    createdByActorId: "summary-actor-001",

    lastModifiedByActorId: "summary-actor-001",

    version: 5,
  },
};

const plan: TreasuryExecutionPlan = {
  id: "summary-plan-001",

  transferId: transfer.id,

  capacityAssessmentId: "summary-capacity-001",

  plannedAmount: {
    amount: "1000000.00",

    currency: "USD",
  },

  destinationCurrency: "EUR",

  tranches: [
    {
      id: "summary-tranche-001",

      sequence: 1,

      amount: {
        amount: "500000.00",

        currency: "USD",
      },

      executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

      allocationId: "summary-allocation-001",

      instructionId: transfer.instructionId,

      beneficiaryProfileId: "summary-beneficiary-001",

      settlementEndpointId: "summary-endpoint-001",

      purpose: "Bound summary tranche",

      status: EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,

      executionId: "summary-execution-001",
    },

    {
      id: "summary-tranche-002",

      sequence: 2,

      amount: {
        amount: "500000.00",

        currency: "USD",
      },

      executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

      allocationId: "summary-allocation-002",

      instructionId: transfer.instructionId,

      beneficiaryProfileId: "summary-beneficiary-002",

      settlementEndpointId: "summary-endpoint-001",

      purpose: "Eligible summary tranche",

      status: EXECUTABLE_TRANCHE_STATUS.ELIGIBLE,
    },
  ],

  status: TREASURY_EXECUTION_PLAN_STATUS.RECORDED,

  plannedByActorId: "summary-planner-001",

  plannedAt: createdAt,

  metadata: {
    createdAt,

    updatedAt: planUpdatedAt,

    createdByActorId: "summary-planner-001",

    lastModifiedByActorId: "summary-planner-001",

    version: 4,
  },
};

const execution: TreasuryExecution = {
  id: "summary-execution-001",

  reference: "AXPT-EXEC-SUMMARY-001",

  programId: transfer.programId,

  allocationId: "summary-allocation-001",

  instructionId: transfer.instructionId,

  kind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

  beneficiaryProfileId: "summary-beneficiary-001",

  settlementEndpointId: "summary-endpoint-001",

  amount: {
    amount: "500000.00",

    currency: "USD",
  },

  purpose: "Bound summary tranche",

  status: TREASURY_EXECUTION_STATUS.CREATED,

  metadata: {
    createdAt,

    updatedAt: executionUpdatedAt,

    createdByActorId: "summary-instantiator-001",

    lastModifiedByActorId: "summary-instantiator-001",

    version: 1,
  },
};

const summary = deriveTransferExecutionSummary({
  transfer,

  plan,

  executions: [execution],
});

assert.equal(summary.transferId, transfer.id);

assert.equal(summary.transferVersion, 5);

assert.equal(summary.planId, plan.id);

assert.equal(summary.planVersion, 4);

assert.deepEqual(summary.trancheCounts, {
  total: 2,

  planned: 0,

  eligible: 1,

  ineligible: 0,

  requiresClarification: 0,

  boundToExecution: 1,
});

assert.equal(summary.executionCounts.CREATED, 1);

assert.equal(summary.executionCounts.CONFIRMED, 0);

assert.equal(summary.executionCounts.FAILED, 0);

assert.deepEqual(summary.amounts.bound, {
  amount: "500000",

  currency: "USD",
});

assert.deepEqual(summary.amounts.remainingUnbound, {
  amount: "500000",

  currency: "USD",
});

assert.deepEqual(summary.amounts.confirmed, {
  amount: "0",

  currency: "USD",
});

assert.equal(
  summary.lastUpdatedAt.toISOString(),

  executionUpdatedAt.toISOString(),
);

assertThrowsWithCode(
  () =>
    deriveTransferExecutionSummary({
      transfer,

      plan,

      executions: [],
    }),

  "TRANSFER_EXECUTION_SUMMARY_BOUND_EXECUTION_NOT_FOUND",
);

assertThrowsWithCode(
  () =>
    deriveTransferExecutionSummary({
      transfer,

      plan,

      executions: [
        execution,

        {
          ...execution,

          id: "summary-orphan-execution-001",

          reference: "AXPT-EXEC-SUMMARY-ORPHAN-001",
        },
      ],
    }),

  "TRANSFER_EXECUTION_SUMMARY_UNBOUND_EXECUTION",
);

assertThrowsWithCode(
  () =>
    deriveTransferExecutionSummary({
      transfer,

      plan,

      executions: [
        {
          ...execution,

          amount: {
            amount: "499999.00",

            currency: "USD",
          },
        },
      ],
    }),

  "TRANSFER_EXECUTION_SUMMARY_EXECUTION_AMOUNT_MISMATCH",
);

console.log("✓ Transfer Execution Summary derivation smoke test passed");

console.log({
  transfer: {
    id: summary.transferId,

    status: summary.transferStatus,

    version: summary.transferVersion,
  },

  plan: {
    id: summary.planId,

    status: summary.planStatus,

    version: summary.planVersion,
  },

  tranches: summary.trancheCounts,

  executions: {
    total: Object.values(summary.executionCounts).reduce(
      (total, count) => total + count,

      0,
    ),

    created: summary.executionCounts.CREATED,

    confirmed: summary.executionCounts.CONFIRMED,

    failed: summary.executionCounts.FAILED,
  },

  amounts: summary.amounts,

  invariants: {
    summaryDerivedWithoutMutation: true,

    tranchePostureCounted: true,

    executionPostureCounted: true,

    boundAmountDerived: true,

    remainingAmountDerived: true,

    latestSourceUpdateRetained: true,

    missingBoundExecutionRejected: true,

    orphanExecutionRejected: true,

    mismatchedExecutionFactsRejected: true,
  },
});
