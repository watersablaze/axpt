import assert from "node:assert/strict";

import { prepareAuthorizedTreasuryExecutionHandoff } from "../../src/domains/treasury/gateway/executions/handoff/prepareAuthorizedTreasuryExecutionHandoff";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import type { TreasuryExecution } from "../../src/domains/treasury/gateway/executions/contracts";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const authorizedAt = new Date("2026-07-04T04:00:00.000Z");

const execution: TreasuryExecution = {
  id: "execution-1",

  reference: "EXEC-001",

  programId: "program-1",

  allocationId: "allocation-1",

  instructionId: "instruction-1",

  kind: "BENEFICIARY_DISTRIBUTION",

  beneficiaryProfileId: "beneficiary-1",

  settlementEndpointId: "endpoint-1",

  amount: {
    amount: "25.5",

    currency: "USD",
  },

  purpose: "Program beneficiary distribution",

  status: TREASURY_EXECUTION_STATUS.AUTHORIZED,

  validatedAt: new Date("2026-07-04T03:30:00.000Z"),

  authorizedAt,

  metadata: {
    createdAt: new Date("2026-07-04T03:00:00.000Z"),

    updatedAt: authorizedAt,

    createdByActorId: "actor-1",

    lastModifiedByActorId: "actor-3",

    version: 4,
  },
};

const context = {
  commandId: "command-handoff-1",

  actorId: "actor-4",

  correlationId: "correlation-1",

  causationId: "command-authorize-1",

  requestedAt: new Date("2026-07-04T04:10:00.000Z"),

  idempotencyKey: "handoff-execution-1",
};

const handoff = prepareAuthorizedTreasuryExecutionHandoff({
  handoffId: "handoff-1",

  execution,

  approvalIds: ["approval-1", "approval-2"],

  context,
});

assert.equal(handoff.executionId, "execution-1");

assert.equal(handoff.executionVersion, 4);

assert.equal(handoff.amount.amount, "25.5");

assert.equal(handoff.amount.currency, "USD");

assert.deepEqual(handoff.authorization.approvalIds, [
  "approval-1",
  "approval-2",
]);

assert.equal(
  handoff.authorization.authorizedAt.toISOString(),
  authorizedAt.toISOString(),
);

assert.equal(handoff.context.correlationId, "correlation-1");

assertThrowsWithCode(
  () =>
    prepareAuthorizedTreasuryExecutionHandoff({
      handoffId: "handoff-2",

      execution: {
        ...execution,

        status: TREASURY_EXECUTION_STATUS.READY_FOR_AUTHORIZATION,
      },

      approvalIds: ["approval-1"],

      context,
    }),
  "TREASURY_EXECUTION_HANDOFF_NOT_AUTHORIZED",
);

assertThrowsWithCode(
  () =>
    prepareAuthorizedTreasuryExecutionHandoff({
      handoffId: "handoff-3",

      execution: {
        ...execution,

        authorizedAt: undefined,
      },

      approvalIds: ["approval-1"],

      context,
    }),
  "TREASURY_EXECUTION_HANDOFF_AUTHORIZATION_TIMESTAMP_REQUIRED",
);

assertThrowsWithCode(
  () =>
    prepareAuthorizedTreasuryExecutionHandoff({
      handoffId: "handoff-4",

      execution,

      approvalIds: [],

      context,
    }),
  "TREASURY_EXECUTION_HANDOFF_APPROVAL_EVIDENCE_REQUIRED",
);

console.log("✓ Treasury execution handoff verification passed");
