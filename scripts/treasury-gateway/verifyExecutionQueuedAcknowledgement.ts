import assert from "node:assert/strict";

import { acknowledgeTreasuryExecutionQueued } from "../../src/domains/treasury/gateway/executions/acknowledgeTreasuryExecutionQueued";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import type { TreasuryExecution } from "../../src/domains/treasury/gateway/executions/contracts";

import type { AcknowledgeTreasuryExecutionQueued } from "../../src/domains/treasury/gateway/executions/commands";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

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
    amount: "25.50",

    currency: "USD",
  },

  purpose: "Program beneficiary distribution",

  status: TREASURY_EXECUTION_STATUS.AUTHORIZED,

  authorizedAt: new Date("2026-07-04T04:00:00.000Z"),

  metadata: {
    createdAt: new Date("2026-07-04T03:00:00.000Z"),

    updatedAt: new Date("2026-07-04T04:00:00.000Z"),

    createdByActorId: "actor-1",

    lastModifiedByActorId: "actor-3",

    version: 4,
  },
};

const command: AcknowledgeTreasuryExecutionQueued = {
  context: {
    commandId: "command-queued-1",

    actorId: "actor-4",

    correlationId: "correlation-1",

    causationId: "command-authorize-1",

    requestedAt: new Date("2026-07-04T04:15:00.000Z"),

    idempotencyKey: "execution-1-queued",
  },

  payload: {
    executionId: "execution-1",

    treasuryActionId: "action-1",

    treasuryQueueJobId: "queue-1",
  },
};

const result = acknowledgeTreasuryExecutionQueued(execution, command);

assert.equal(result.aggregate.status, TREASURY_EXECUTION_STATUS.QUEUED);

assert.equal(result.aggregate.metadata.version, 5);

assert.equal(result.aggregate.metadata.lastModifiedByActorId, "actor-4");

assert.equal(
  result.event.eventType,
  TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,
);

assert.equal(result.event.payload.treasuryActionId, "action-1");

assert.equal(result.event.payload.treasuryQueueJobId, "queue-1");

assert.equal(
  result.event.payload.queuedAt.toISOString(),
  "2026-07-04T04:15:00.000Z",
);

assertThrowsWithCode(
  () =>
    acknowledgeTreasuryExecutionQueued(
      execution,

      {
        ...command,

        payload: {
          ...command.payload,

          executionId: "execution-other",
        },
      },
    ),

  "TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH",
);

assertThrowsWithCode(
  () =>
    acknowledgeTreasuryExecutionQueued(
      execution,

      {
        ...command,

        payload: {
          ...command.payload,

          treasuryActionId: "   ",
        },
      },
    ),

  "TREASURY_EXECUTION_OPERATIONAL_ACTION_ID_REQUIRED",
);

assertThrowsWithCode(
  () =>
    acknowledgeTreasuryExecutionQueued(
      {
        ...execution,

        status: TREASURY_EXECUTION_STATUS.CREATED,
      },

      command,
    ),

  "TREASURY_EXECUTION_TRANSITION_INVALID",
);

console.log("✓ Treasury execution queued acknowledgement verification passed");
