import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `smoke-durable-validation-${fixtureId}`;

  const createdAt = new Date();

  const createContext = {
    commandId: `command-create-${fixtureId}`,

    actorId: `actor-create-${fixtureId}`,

    correlationId: `correlation-${fixtureId}`,

    requestedAt: createdAt,

    idempotencyKey: `create-${fixtureId}`,
  };

  const created = createTreasuryExecution({
    executionId,

    reference: `SMOKE-${fixtureId}`,

    command: {
      context: createContext,

      payload: {
        programId: `program-${fixtureId}`,

        allocationId: `allocation-${fixtureId}`,

        kind: "BENEFICIARY_DISTRIBUTION",

        amount: {
          amount: "25.50",

          currency: "USD",
        },

        purpose: "Durable validation workflow smoke test",
      },
    },
  });

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryExecutionWithClient({
        result: created,

        eventId: `event-created-${fixtureId}`,

        context: createContext,

        client: tx,
      }),
    );

    const transitionAt = new Date(createdAt.getTime() + 60_000);

    const transition = await prisma.$transaction(
      async (tx: TransactionClient) =>
        beginTreasuryExecutionValidationDurablyWithClient({
          command: {
            context: {
              commandId: `command-validation-${fixtureId}`,

              actorId: `actor-validation-${fixtureId}`,

              correlationId: `correlation-${fixtureId}`,

              causationId: createContext.commandId,

              requestedAt: transitionAt,

              idempotencyKey: `validation-${fixtureId}`,
            },

            payload: {
              executionId,
            },
          },

          eventId: `event-validation-${fixtureId}`,

          client: tx,
        }),
    );

    assert.equal(
      transition.aggregate.status,
      TREASURY_EXECUTION_STATUS.VALIDATING,
    );

    assert.equal(transition.aggregate.metadata.version, 2);

    assert.equal(
      transition.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_VALIDATION_STARTED,
    );

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionWithClient({
        executionId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.status, TREASURY_EXECUTION_STATUS.VALIDATING);

    assert.equal(loaded.aggregate.metadata.version, 2);

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    });

    assert.equal(eventCount, 2);

    console.log(
      "✓ Treasury Gateway durable validation workflow smoke test passed",
    );

    console.log({
      executionId,

      status: loaded.aggregate.status,

      version: loaded.aggregate.metadata.version,

      eventType: transition.event.eventType,

      eventCount,
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
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
