import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

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

  const executionId = `smoke-execution-${fixtureId}`;

  const eventId = `smoke-event-${fixtureId}`;

  const createdAt = new Date();

  const context = {
    commandId: `smoke-command-${fixtureId}`,

    actorId: `smoke-actor-${fixtureId}`,

    authorityGrantId: `smoke-authority-${fixtureId}`,

    correlationId: `smoke-correlation-${fixtureId}`,

    requestedAt: createdAt,

    idempotencyKey: `smoke-create-${fixtureId}`,
  };

  const created = createTreasuryExecution({
    executionId,

    reference: `SMOKE-${fixtureId}`,

    command: {
      context,

      payload: {
        programId: `smoke-program-${fixtureId}`,

        allocationId: `smoke-allocation-${fixtureId}`,

        instructionId: `smoke-instruction-${fixtureId}`,

        kind: "BENEFICIARY_DISTRIBUTION",

        beneficiaryProfileId: `smoke-beneficiary-${fixtureId}`,

        settlementEndpointId: `smoke-endpoint-${fixtureId}`,

        amount: {
          amount: "25.50",

          currency: "USD",
        },

        purpose: "Persist new execution smoke test",
      },
    },
  });

  try {
    const persisted = await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryExecutionWithClient({
        result: created,

        eventId,

        context,

        client: tx,
      }),
    );

    assert.equal(persisted.aggregate.status, TREASURY_EXECUTION_STATUS.CREATED);

    assert.equal(persisted.aggregate.metadata.version, 1);

    assert.equal(persisted.event.eventId, eventId);

    assert(persisted.event.sequence > 0n);

    assert.equal(
      persisted.event.aggregateType,
      TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
    );

    assert.equal(persisted.event.aggregateVersion, 1);

    assert.equal(
      persisted.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CREATED,
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

    assert.equal(snapshot.version, 1);

    assert.equal(snapshot.status, TREASURY_EXECUTION_STATUS.CREATED);

    const snapshotJson = snapshot.snapshot as Record<string, unknown>;

    assert.equal(snapshotJson.id, executionId);

    assert.equal(snapshotJson.status, TREASURY_EXECUTION_STATUS.CREATED);

    const event = await prisma.treasuryGatewayEvent.findUnique({
      where: {
        eventId,
      },
    });

    assert(event);

    assert.equal(event.aggregateId, executionId);

    assert.equal(event.aggregateVersion, 1);

    assert.equal(event.sequence, persisted.event.sequence);

    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistNewTreasuryExecutionWithClient({
          result: created,

          eventId: `smoke-event-duplicate-${fixtureId}`,

          context,

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicateError = error;
    }

    assertErrorCode(
      duplicateError,
      "TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS",
    );

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    console.log(
      "✓ Treasury Gateway new execution persistence smoke test passed",
    );

    console.log({
      executionId,

      status: snapshot.status,

      version: snapshot.version,

      eventId,

      sequence: persisted.event.sequence.toString(),

      eventType: persisted.event.eventType,
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
