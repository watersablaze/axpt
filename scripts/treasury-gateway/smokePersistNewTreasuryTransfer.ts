import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { persistNewTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/persistNewTreasuryTransferWithClient";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

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

  const transferId = `smoke-transfer-${fixtureId}`;

  const eventId = `smoke-transfer-created-event-${fixtureId}`;

  const context = {
    commandId: `smoke-transfer-create-command-${fixtureId}`,

    actorId: `smoke-transfer-creator-${fixtureId}`,

    correlationId: `smoke-transfer-correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-create-${fixtureId}`,
  };

  const created = createTreasuryTransfer({
    transferId,

    reference: `SMOKE-TRANSFER-${fixtureId}`,

    command: {
      context,

      payload: {
        programId: `smoke-transfer-program-${fixtureId}`,

        instructionId: `smoke-transfer-instruction-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-transfer-program-account-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-transfer-endpoint-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "EUR",

        purpose: "Treasury Transfer persistence smoke test",
      },
    },
  });

  try {
    const persisted = await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryTransferWithClient({
        result: created,

        eventId,

        context,

        client: tx,
      }),
    );

    assert.equal(persisted.aggregate.id, transferId);

    assert.equal(persisted.aggregate.status, TREASURY_TRANSFER_STATUS.CREATED);

    assert.equal(persisted.aggregate.metadata.version, 1);

    assert.equal(
      persisted.event.aggregateType,
      TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
    );

    assert.equal(persisted.event.aggregateId, transferId);

    assert.equal(persisted.event.aggregateVersion, 1);

    assert.equal(
      persisted.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CREATED,
    );

    assert.equal(persisted.event.payload.transferId, transferId);

    const aggregateRow = await prisma.treasuryGatewayAggregate.findFirst({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    assert(aggregateRow);

    assert.equal(aggregateRow.version, 1);

    assert.equal(aggregateRow.status, TREASURY_TRANSFER_STATUS.CREATED);

    const snapshot = aggregateRow.snapshot as {
      id?: unknown;

      reference?: unknown;

      status?: unknown;

      destinationCurrency?: unknown;

      metadata?: {
        version?: unknown;
      };
    };

    assert.equal(snapshot.id, transferId);

    assert.equal(snapshot.reference, created.aggregate.reference);

    assert.equal(snapshot.status, TREASURY_TRANSFER_STATUS.CREATED);

    assert.equal(snapshot.destinationCurrency, "EUR");

    assert.equal(snapshot.metadata?.version, 1);

    const eventRow = await prisma.treasuryGatewayEvent.findUnique({
      where: {
        eventId,
      },
    });

    assert(eventRow);

    assert.equal(
      eventRow.aggregateType,
      TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
    );

    assert.equal(eventRow.aggregateId, transferId);

    assert.equal(eventRow.aggregateVersion, 1);

    assert.equal(
      eventRow.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CREATED,
    );

    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistNewTreasuryTransferWithClient({
          result: created,

          eventId: `smoke-transfer-duplicate-event-${fixtureId}`,

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
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    console.log(
      "✓ Treasury Gateway new Transfer persistence smoke test passed",
    );

    console.log({
      transferId,

      status: persisted.aggregate.status,

      version: persisted.aggregate.metadata.version,

      eventType: persisted.event.eventType,

      aggregateCount,

      eventCount,

      invariants: {
        transferSnapshotPersisted: true,

        transferCreatedEventPersisted: true,

        aggregateTypeSeparated: true,

        duplicateTransferRejected: true,

        duplicateAttemptDidNotAppendEvent: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
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
