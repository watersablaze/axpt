import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { beginTreasuryExecutionValidation } from "../../src/domains/treasury/gateway/executions/beginTreasuryExecutionValidation";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { persistTreasuryExecutionTransitionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistTreasuryExecutionTransitionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

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

  const executionId = `smoke-transition-${fixtureId}`;

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

        purpose: "Transition persistence smoke test",
      },
    },
  });

  const transitionAt = new Date(createdAt.getTime() + 60_000);

  const transitionContext = {
    commandId: `command-transition-${fixtureId}`,

    actorId: `actor-transition-${fixtureId}`,

    correlationId: `correlation-${fixtureId}`,

    causationId: createContext.commandId,

    requestedAt: transitionAt,

    idempotencyKey: `transition-${fixtureId}`,
  };

  const validating = beginTreasuryExecutionValidation(created.aggregate, {
    context: transitionContext,

    payload: {
      executionId,
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

    const persistedTransition = await prisma.$transaction(
      async (tx: TransactionClient) =>
        persistTreasuryExecutionTransitionWithClient({
          expectedVersion: 1,

          result: validating,

          eventId: `event-validating-${fixtureId}`,

          context: transitionContext,

          client: tx,
        }),
    );

    assert.equal(
      persistedTransition.aggregate.status,
      TREASURY_EXECUTION_STATUS.VALIDATING,
    );

    assert.equal(persistedTransition.aggregate.metadata.version, 2);

    assert.equal(persistedTransition.event.aggregateVersion, 2);

    let staleWriteError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistTreasuryExecutionTransitionWithClient({
          expectedVersion: 1,

          result: validating,

          eventId: `event-stale-${fixtureId}`,

          context: transitionContext,

          client: tx,
        }),
      );
    } catch (error: unknown) {
      staleWriteError = error;
    }

    assertErrorCode(
      staleWriteError,
      "TREASURY_GATEWAY_EXECUTION_CONCURRENCY_CONFLICT",
    );

    const snapshot = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

          aggregateId: executionId,
        },
      },
    });

    assert(snapshot);

    assert.equal(snapshot.version, 2);

    assert.equal(snapshot.status, TREASURY_EXECUTION_STATUS.VALIDATING);

    const events = await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },

      orderBy: {
        aggregateVersion: "asc",
      },
    });

    assert.equal(events.length, 2);

    assert.deepEqual(
      events.map(
        (event: { aggregateVersion: number }) => event.aggregateVersion,
      ),
      [1, 2],
    );

    console.log(
      "✓ Treasury Gateway execution transition persistence smoke test passed",
    );

    console.log({
      executionId,

      snapshotStatus: snapshot.status,

      snapshotVersion: snapshot.version,

      eventVersions: events.map(
        (event: { aggregateVersion: number }) => event.aggregateVersion,
      ),
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
