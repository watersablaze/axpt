import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import type { LoadedTreasuryExecution } from "../../src/domains/treasury/gateway/executions/persistence/contracts";

import { loadTreasuryExecutionsWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionsWithClient";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const firstExecutionId = `smoke-batch-execution-001-${fixtureId}`;

  const secondExecutionId = `smoke-batch-execution-002-${fixtureId}`;

  const missingExecutionId = `smoke-batch-execution-missing-${fixtureId}`;

  const correlationId = `smoke-batch-execution-correlation-${fixtureId}`;

  const createdAt = new Date();

  const createExecution = (executionId: string, sequence: number) =>
    createTreasuryExecution({
      executionId,

      reference: `AXPT-BATCH-EXECUTION-${sequence}-${fixtureId}`,

      command: {
        context: {
          commandId: `smoke-batch-create-command-${sequence}-${fixtureId}`,

          actorId: `smoke-batch-create-actor-${fixtureId}`,

          correlationId,

          requestedAt: createdAt,

          idempotencyKey: `smoke-batch-create-${sequence}-${fixtureId}`,
        },

        payload: {
          programId: `smoke-batch-program-${fixtureId}`,

          allocationId: `smoke-batch-allocation-${sequence}-${fixtureId}`,

          instructionId: `smoke-batch-instruction-${fixtureId}`,

          kind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          beneficiaryProfileId: `smoke-batch-beneficiary-${sequence}-${fixtureId}`,

          settlementEndpointId: `smoke-batch-endpoint-${fixtureId}`,

          amount: {
            amount: sequence === 1 ? "250000.00" : "750000.00",

            currency: "USD",
          },

          purpose: `Batch execution ${sequence}`,
        },
      },
    });

  const firstCreated = createExecution(firstExecutionId, 1);

  const secondCreated = createExecution(secondExecutionId, 2);

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await persistNewTreasuryExecutionWithClient({
        result: firstCreated,

        eventId: `smoke-batch-event-001-${fixtureId}`,

        context: {
          commandId: `smoke-batch-create-command-001-${fixtureId}`,

          actorId: `smoke-batch-create-actor-${fixtureId}`,

          correlationId,

          requestedAt: createdAt,

          idempotencyKey: `smoke-batch-create-001-${fixtureId}`,
        },

        client: tx,
      });

      await persistNewTreasuryExecutionWithClient({
        result: secondCreated,

        eventId: `smoke-batch-event-002-${fixtureId}`,

        context: {
          commandId: `smoke-batch-create-command-002-${fixtureId}`,

          actorId: `smoke-batch-create-actor-${fixtureId}`,

          correlationId,

          requestedAt: createdAt,

          idempotencyKey: `smoke-batch-create-002-${fixtureId}`,
        },

        client: tx,
      });
    });

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionsWithClient({
        executionIds: [secondExecutionId, firstExecutionId],

        client: tx,
      }),
    );

    assert.equal(loaded.length, 2);

    assert.equal(loaded[0]?.aggregate.id, secondExecutionId);

    assert.equal(loaded[1]?.aggregate.id, firstExecutionId);

    assert.equal(
      loaded[0]?.aggregate.status,
      TREASURY_EXECUTION_STATUS.CREATED,
    );

    assert.equal(
      loaded[1]?.aggregate.status,
      TREASURY_EXECUTION_STATUS.CREATED,
    );

    assert.equal(loaded[0]?.loadedAt.getTime(), loaded[1]?.loadedAt.getTime());

    const empty = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionsWithClient({
        executionIds: [],

        client: tx,
      }),
    );

    assert.deepEqual(empty, []);

    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryExecutionsWithClient({
          executionIds: [firstExecutionId, firstExecutionId],

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicateError = error;
    }

    assertErrorCode(
      duplicateError,
      "TREASURY_GATEWAY_EXECUTION_BATCH_DUPLICATE_ID",
    );

    let missingError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryExecutionsWithClient({
          executionIds: [firstExecutionId, missingExecutionId],

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingError = error;
    }

    assertErrorCode(missingError, "TREASURY_GATEWAY_EXECUTION_BATCH_NOT_FOUND");

    console.log("✓ Treasury Execution exact batch load smoke test passed");

    console.log({
      requestedOrder: [secondExecutionId, firstExecutionId],

      loadedOrder: loaded.map(
        (entry: LoadedTreasuryExecution) => entry.aggregate.id,
      ),

      statuses: loaded.map(
        (entry: LoadedTreasuryExecution) => entry.aggregate.status,
      ),

      invariants: {
        exactExecutionsLoaded: true,

        requestedOrderingPreserved: true,

        sharedLoadTimestampUsed: true,

        emptyInputReturnsEmpty: true,

        duplicateInputRejected: true,

        missingExecutionRejected: true,

        snapshotsDecodedAndVerified: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: {
          in: [firstExecutionId, secondExecutionId, missingExecutionId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: {
          in: [firstExecutionId, secondExecutionId, missingExecutionId],
        },
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
