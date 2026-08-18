import assert from "node:assert/strict";

import { toControlCenterTransferExecutionSummary } from "../../src/domains/control-center/treasury/transferExecutionSummary";

import type { TransferExecutionSummary } from "../../src/domains/treasury/gateway/transfer-execution-summary/contracts";

const lastUpdatedAt = new Date("2026-08-08T10:30:00.000Z");

const summary: TransferExecutionSummary = {
  transferId: "control-center-transfer-001",

  transferStatus: "PLANNED",

  transferVersion: 5,

  planId: "control-center-plan-001",

  planStatus: "RECORDED",

  planVersion: 4,

  trancheCounts: {
    total: 2,

    planned: 0,

    eligible: 1,

    ineligible: 0,

    requiresClarification: 0,

    boundToExecution: 1,
  },

  executionCounts: {
    CREATED: 1,

    VALIDATING: 0,

    READY_FOR_AUTHORIZATION: 0,

    AUTHORIZED: 0,

    QUEUED: 0,

    INITIATED: 0,

    PENDING_EXTERNAL_CONFIRMATION: 0,

    CONFIRMED: 0,

    FAILED: 0,

    REQUIRES_INTERVENTION: 0,

    REVERSED: 0,

    CANCELLED: 0,
  },

  amounts: {
    planned: {
      amount: "1000000.00",

      currency: "USD",
    },

    bound: {
      amount: "500000",

      currency: "USD",
    },

    confirmed: {
      amount: "0",

      currency: "USD",
    },

    failed: {
      amount: "0",

      currency: "USD",
    },

    remainingUnbound: {
      amount: "500000",

      currency: "USD",
    },
  },

  lastUpdatedAt,
};

const dto = toControlCenterTransferExecutionSummary(summary);

assert.equal(dto.transferId, summary.transferId);

assert.equal(dto.planId, summary.planId);

assert.deepEqual(dto.trancheCounts, summary.trancheCounts);

assert.deepEqual(dto.executionCounts, summary.executionCounts);

assert.deepEqual(dto.amounts, summary.amounts);

assert.equal(dto.lastUpdatedAt, lastUpdatedAt.toISOString());

assert.equal(typeof dto.lastUpdatedAt, "string");

assert.equal(summary.lastUpdatedAt, lastUpdatedAt);

console.log(
  "✓ Control Center Transfer Execution Summary serialization smoke test passed",
);

console.log({
  transferId: dto.transferId,

  transferStatus: dto.transferStatus,

  planId: dto.planId,

  planStatus: dto.planStatus,

  lastUpdatedAt: dto.lastUpdatedAt,

  invariants: {
    gatewayProjectionAccepted: true,

    transportRepresentationProduced: true,

    domainDateSerializedExplicitly: true,

    tranchePosturePreserved: true,

    executionPosturePreserved: true,

    amountPosturePreserved: true,

    sourceProjectionUnchanged: true,
  },
});
