import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `smoke-durable-lifecycle-${fixtureId}`;

  const correlationId = `correlation-${fixtureId}`;

  const createdAt = new Date();

  const createContext = {
    commandId: `command-create-${fixtureId}`,

    actorId: `actor-create-${fixtureId}`,

    correlationId,

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

        purpose: "Durable execution lifecycle smoke test",
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

    const validationContext = {
      commandId: `command-validation-${fixtureId}`,

      actorId: `actor-validation-${fixtureId}`,

      correlationId,

      causationId: createContext.commandId,

      requestedAt: new Date(createdAt.getTime() + 60_000),

      idempotencyKey: `validation-${fixtureId}`,
    };

    const validating = await prisma.$transaction(
      async (tx: TransactionClient) =>
        beginTreasuryExecutionValidationDurablyWithClient({
          command: {
            context: validationContext,

            payload: {
              executionId,
            },
          },

          eventId: `event-validation-${fixtureId}`,

          client: tx,
        }),
    );

    assert.equal(
      validating.aggregate.status,
      TREASURY_EXECUTION_STATUS.VALIDATING,
    );

    assert.equal(validating.aggregate.metadata.version, 2);

    const readyContext = {
      commandId: `command-ready-${fixtureId}`,

      actorId: `actor-ready-${fixtureId}`,

      correlationId,

      causationId: validationContext.commandId,

      requestedAt: new Date(createdAt.getTime() + 120_000),

      idempotencyKey: `ready-${fixtureId}`,
    };

    const ready = await prisma.$transaction(async (tx: TransactionClient) =>
      markTreasuryExecutionReadyForAuthorizationDurablyWithClient({
        command: {
          context: readyContext,

          payload: {
            executionId,

            validationEvidenceArtifactIds: [`artifact-${fixtureId}`],

            validationNotes: "Lifecycle smoke validation complete",
          },
        },

        eventId: `event-ready-${fixtureId}`,

        client: tx,
      }),
    );

    assert.equal(
      ready.aggregate.status,
      TREASURY_EXECUTION_STATUS.READY_FOR_AUTHORIZATION,
    );

    assert.equal(ready.aggregate.metadata.version, 3);

    const authorizationContext = {
      commandId: `command-authorization-${fixtureId}`,

      actorId: `actor-authorization-${fixtureId}`,

      authorityGrantId: `authority-grant-${fixtureId}`,

      correlationId,

      causationId: readyContext.commandId,

      requestedAt: new Date(createdAt.getTime() + 180_000),

      idempotencyKey: `authorization-${fixtureId}`,
    };

    const authorized = await prisma.$transaction(
      async (tx: TransactionClient) =>
        authorizeTreasuryExecutionDurablyWithClient({
          command: {
            context: authorizationContext,

            payload: {
              executionId,

              approvalIds: [`approval-${fixtureId}`],
            },
          },

          eventId: `event-authorized-${fixtureId}`,

          client: tx,
        }),
    );

    assert.equal(
      authorized.aggregate.status,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );

    assert.equal(authorized.aggregate.metadata.version, 4);

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionWithClient({
        executionId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.status, TREASURY_EXECUTION_STATUS.AUTHORIZED);

    assert.equal(loaded.aggregate.metadata.version, 4);

    assert(loaded.aggregate.validatedAt instanceof Date);

    assert(loaded.aggregate.authorizedAt instanceof Date);

    const events = await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },

      orderBy: {
        aggregateVersion: "asc",
      },

      select: {
        aggregateVersion: true,

        eventType: true,

        authorityGrantId: true,
      },
    });

    assert.deepEqual(
      events.map(
        (event: { aggregateVersion: number }) => event.aggregateVersion,
      ),

      [1, 2, 3, 4],
    );

    assert.equal(events.length, 4);

    assert.equal(
      events[3]?.authorityGrantId,
      authorizationContext.authorityGrantId,
    );

    console.log(
      "✓ Treasury Gateway durable execution lifecycle smoke test passed",
    );

    console.log({
      executionId,

      finalStatus: loaded.aggregate.status,

      finalVersion: loaded.aggregate.metadata.version,

      eventVersions: events.map(
        (event: { aggregateVersion: number }) => event.aggregateVersion,
      ),

      eventCount: events.length,
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
