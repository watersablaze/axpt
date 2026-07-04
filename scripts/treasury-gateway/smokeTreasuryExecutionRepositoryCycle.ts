import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { beginTreasuryExecutionValidation } from "../../src/domains/treasury/gateway/executions/beginTreasuryExecutionValidation";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { persistTreasuryExecutionTransitionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistTreasuryExecutionTransitionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `smoke-repository-cycle-${fixtureId}`;

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

        purpose: "Repository cycle smoke test",
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

    const loadedCreated = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId,

          client: tx,
        }),
    );

    assert(loadedCreated);

    assert(loadedCreated.aggregate.metadata.createdAt instanceof Date);

    assert(loadedCreated.aggregate.metadata.updatedAt instanceof Date);

    assert.equal(
      loadedCreated.aggregate.status,
      TREASURY_EXECUTION_STATUS.CREATED,
    );

    assert.equal(loadedCreated.aggregate.metadata.version, 1);

    const transitionAt = new Date(createdAt.getTime() + 60_000);

    const transitionContext = {
      commandId: `command-transition-${fixtureId}`,

      actorId: `actor-transition-${fixtureId}`,

      correlationId: `correlation-${fixtureId}`,

      causationId: createContext.commandId,

      requestedAt: transitionAt,

      idempotencyKey: `transition-${fixtureId}`,
    };

    const validating = beginTreasuryExecutionValidation(
      loadedCreated.aggregate,
      {
        context: transitionContext,

        payload: {
          executionId,
        },
      },
    );

    await prisma.$transaction(async (tx: TransactionClient) =>
      persistTreasuryExecutionTransitionWithClient({
        expectedVersion: loadedCreated.aggregate.metadata.version,

        result: validating,

        eventId: `event-validating-${fixtureId}`,

        context: transitionContext,

        client: tx,
      }),
    );

    const loadedValidating = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId,

          client: tx,
        }),
    );

    assert(loadedValidating);

    assert.equal(
      loadedValidating.aggregate.status,
      TREASURY_EXECUTION_STATUS.VALIDATING,
    );

    assert.equal(loadedValidating.aggregate.metadata.version, 2);

    assert(loadedValidating.aggregate.metadata.updatedAt instanceof Date);

    assert.equal(
      loadedValidating.aggregate.metadata.updatedAt.toISOString(),
      transitionAt.toISOString(),
    );

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    });

    assert.equal(eventCount, 2);

    console.log(
      "✓ Treasury Gateway execution repository cycle smoke test passed",
    );

    console.log({
      executionId,

      initialStatus: loadedCreated.aggregate.status,

      finalStatus: loadedValidating.aggregate.status,

      finalVersion: loadedValidating.aggregate.metadata.version,

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
