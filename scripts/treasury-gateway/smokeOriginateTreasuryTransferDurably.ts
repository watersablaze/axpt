import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { loadTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/loadTreasuryTransferWithClient";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const prisma = new PrismaClient();

function assertErrorCode(
  error: unknown,

  code: string,
): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),

    `Expected ${code}, received ${error.message}`,
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-originate-transfer-${fixtureId}`;

  const eventId = `smoke-originate-transfer-event-${fixtureId}`;

  const context = {
    commandId: `smoke-originate-command-${fixtureId}`,

    actorId: `smoke-originate-actor-${fixtureId}`,

    correlationId: `smoke-originate-correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-originate-${fixtureId}`,
  };

  try {
    const originated = await prisma.$transaction(
      async (tx: TransactionClient) =>
        originateTreasuryTransferDurablyWithClient({
          request: {
            transferId,

            reference: `AXPT-TRANSFER-${fixtureId}`,

            eventId,

            context,

            payload: {
              programId: `smoke-program-${fixtureId}`,

              instructionId: undefined,

              source: {
                kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

                programAccountId: `smoke-program-account-${fixtureId}`,
              },

              destination: {
                kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

                settlementEndpointId: `smoke-settlement-endpoint-${fixtureId}`,
              },

              requestedAmount: {
                amount: "125000.00",

                currency: "USD",
              },

              destinationCurrency: "USD",

              purpose: "Durable Treasury Transfer origination smoke",
            },
          },

          client: tx,
        }),
    );

    assert.equal(originated.aggregate.id, transferId);

    assert.equal(originated.aggregate.status, TREASURY_TRANSFER_STATUS.CREATED);

    assert.equal(originated.aggregate.metadata.version, 1);

    assert.equal(
      originated.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CREATED,
    );

    assert.equal(originated.event.aggregateVersion, 1);

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryTransferWithClient({
        transferId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.id, transferId);

    assert.equal(loaded.aggregate.status, TREASURY_TRANSFER_STATUS.CREATED);

    assert.equal(loaded.aggregate.metadata.version, 1);

    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        originateTreasuryTransferDurablyWithClient({
          request: {
            transferId,

            reference: `AXPT-TRANSFER-${fixtureId}`,

            eventId: `smoke-originate-duplicate-event-${fixtureId}`,

            context: {
              ...context,

              commandId: `smoke-originate-duplicate-command-${fixtureId}`,

              idempotencyKey: `smoke-originate-duplicate-${fixtureId}`,
            },

            payload: {
              programId: `smoke-program-${fixtureId}`,

              source: {
                kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

                programAccountId: `smoke-program-account-${fixtureId}`,
              },

              destination: {
                kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

                settlementEndpointId: `smoke-settlement-endpoint-${fixtureId}`,
              },

              requestedAmount: {
                amount: "125000.00",

                currency: "USD",
              },

              destinationCurrency: "USD",

              purpose: "Duplicate origination attempt",
            },
          },

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

    console.log("✓ Durable Treasury Transfer origination smoke test passed");

    console.log({
      transferId,

      status: loaded.aggregate.status,

      version: loaded.aggregate.metadata.version,

      eventType: originated.event.eventType,

      invariants: {
        canonicalOriginationServiceUsed: true,

        transferCreatedAtVersionOne: true,

        createdEventPersisted: true,

        transferReloadedDurably: true,

        duplicateOriginationRejected: true,

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
