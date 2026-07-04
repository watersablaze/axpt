import assert from "node:assert/strict";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { beginTreasuryExecutionValidation } from "../../src/domains/treasury/gateway/executions/beginTreasuryExecutionValidation";

import { markTreasuryExecutionReadyForAuthorization } from "../../src/domains/treasury/gateway/executions/markTreasuryExecutionReadyForAuthorization";

import { authorizeTreasuryExecution } from "../../src/domains/treasury/gateway/executions/authorizeTreasuryExecution";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import type {
  BeginTreasuryExecutionValidation,
  MarkTreasuryExecutionReadyForAuthorization,
  AuthorizeTreasuryExecution,
} from "../../src/domains/treasury/gateway/executions/commands";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const createdAt = new Date("2026-07-04T03:00:00.000Z");

const validatingAt = new Date("2026-07-04T03:10:00.000Z");

const readyAt = new Date("2026-07-04T03:20:00.000Z");

const authorizedAt = new Date("2026-07-04T03:30:00.000Z");

const created = createTreasuryExecution({
  executionId: "execution-1",

  reference: "EXEC-001",

  command: {
    context: {
      commandId: "command-create-execution-1",

      actorId: "actor-1",

      correlationId: "correlation-1",

      requestedAt: createdAt,

      idempotencyKey: "create-execution-1",
    },

    payload: {
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
    },
  },
});

assert.equal(created.aggregate.status, TREASURY_EXECUTION_STATUS.CREATED);

assert.equal(created.aggregate.metadata.version, 1);

assert.equal(created.aggregate.amount.amount, "25.5");

const beginValidationCommand: BeginTreasuryExecutionValidation = {
  context: {
    commandId: "command-begin-validation-1",

    actorId: "actor-2",

    correlationId: "correlation-1",

    requestedAt: validatingAt,

    idempotencyKey: "begin-validation-1",
  },

  payload: {
    executionId: "execution-1",
  },
};

const validating = beginTreasuryExecutionValidation(
  created.aggregate,
  beginValidationCommand,
);

assert.equal(validating.aggregate.status, TREASURY_EXECUTION_STATUS.VALIDATING);

assert.equal(validating.aggregate.metadata.version, 2);

const readyCommand: MarkTreasuryExecutionReadyForAuthorization = {
  context: {
    commandId: "command-ready-1",

    actorId: "actor-2",

    correlationId: "correlation-1",

    requestedAt: readyAt,

    idempotencyKey: "ready-1",
  },

  payload: {
    executionId: "execution-1",

    validationEvidenceArtifactIds: ["artifact-1", "artifact-2"],

    validationNotes: "Execution validation complete",
  },
};

const ready = markTreasuryExecutionReadyForAuthorization(
  validating.aggregate,
  readyCommand,
);

assert.equal(
  ready.aggregate.status,
  TREASURY_EXECUTION_STATUS.READY_FOR_AUTHORIZATION,
);

assert.equal(ready.aggregate.validatedAt?.toISOString(), readyAt.toISOString());

assert.equal(ready.aggregate.metadata.version, 3);

assert.deepEqual(ready.event.payload.validationEvidenceArtifactIds, [
  "artifact-1",
  "artifact-2",
]);

const authorizeCommand: AuthorizeTreasuryExecution = {
  context: {
    commandId: "command-authorize-1",

    actorId: "actor-3",

    correlationId: "correlation-1",

    requestedAt: authorizedAt,

    idempotencyKey: "authorize-1",
  },

  payload: {
    executionId: "execution-1",

    approvalIds: ["approval-1", "approval-2"],
  },
};

const authorized = authorizeTreasuryExecution(
  ready.aggregate,
  authorizeCommand,
);

assert.equal(authorized.aggregate.status, TREASURY_EXECUTION_STATUS.AUTHORIZED);

assert.equal(
  authorized.aggregate.authorizedAt?.toISOString(),
  authorizedAt.toISOString(),
);

assert.equal(authorized.aggregate.metadata.version, 4);

assert.deepEqual(authorized.event.payload.approvalIds, [
  "approval-1",
  "approval-2",
]);

assertThrowsWithCode(
  () =>
    beginTreasuryExecutionValidation(created.aggregate, {
      ...beginValidationCommand,

      payload: {
        executionId: "execution-other",
      },
    }),
  "TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH",
);

assertThrowsWithCode(
  () =>
    authorizeTreasuryExecution(ready.aggregate, {
      ...authorizeCommand,

      payload: {
        executionId: "execution-1",

        approvalIds: [],
      },
    }),
  "TREASURY_EXECUTION_APPROVAL_EVIDENCE_REQUIRED",
);

assertThrowsWithCode(
  () => authorizeTreasuryExecution(created.aggregate, authorizeCommand),
  "TREASURY_EXECUTION_TRANSITION_INVALID",
);

assertThrowsWithCode(
  () =>
    markTreasuryExecutionReadyForAuthorization(created.aggregate, readyCommand),
  "TREASURY_EXECUTION_TRANSITION_INVALID",
);

console.log("✓ Treasury execution verification passed");
