import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { loadTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/loadTreasuryTransferWithClient";

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

  const transferId = `smoke-load-transfer-${fixtureId}`;

  const malformedTransferId = `smoke-load-transfer-malformed-${fixtureId}`;

  const context = {
    commandId: `smoke-load-transfer-command-${fixtureId}`,

    actorId: `smoke-load-transfer-actor-${fixtureId}`,

    correlationId: `smoke-load-transfer-correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-load-transfer-${fixtureId}`,
  };

  const created = createTreasuryTransfer({
    transferId,

    reference: `SMOKE-LOAD-TRANSFER-${fixtureId}`,

    command: {
      context,

      payload: {
        programId: `smoke-load-program-${fixtureId}`,

        instructionId: `smoke-load-instruction-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY,

          treasuryPartyId: `smoke-load-party-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE,

          externalReference: `smoke-load-external-${fixtureId}`,
        },

        requestedAmount: {
          amount: "275000.50",

          currency: "USD",
        },

        destinationCurrency: "ZAR",

        purpose: "Load Treasury Transfer persistence smoke test",
      },
    },
  });

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await persistNewTreasuryTransferWithClient({
        result: created,

        eventId: `smoke-load-transfer-event-${fixtureId}`,

        context,

        client: tx,
      });
    });

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

    assert(loaded.aggregate.metadata.createdAt instanceof Date);

    assert(loaded.aggregate.metadata.updatedAt instanceof Date);

    assert.equal(
      loaded.aggregate.metadata.createdAt.toISOString(),
      created.aggregate.metadata.createdAt.toISOString(),
    );

    assert.equal(
      loaded.aggregate.metadata.updatedAt.toISOString(),
      created.aggregate.metadata.updatedAt.toISOString(),
    );

    assert.equal(
      loaded.aggregate.source.kind,
      TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY,
    );

    if (
      loaded.aggregate.source.kind !==
      TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY
    ) {
      throw new Error("Expected Treasury Party source");
    }

    assert.equal(
      loaded.aggregate.source.treasuryPartyId,
      `smoke-load-party-${fixtureId}`,
    );

    assert.equal(
      loaded.aggregate.destination.kind,
      TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE,
    );

    if (
      loaded.aggregate.destination.kind !==
      TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE
    ) {
      throw new Error("Expected External Reference destination");
    }

    assert.equal(
      loaded.aggregate.destination.externalReference,
      `smoke-load-external-${fixtureId}`,
    );

    assert.equal(loaded.aggregate.requestedAmount.amount, "275000.50");

    assert.equal(loaded.aggregate.requestedAmount.currency, "USD");

    assert.equal(loaded.aggregate.destinationCurrency, "ZAR");

    assert(loaded.loadedAt instanceof Date);

    const missing = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryTransferWithClient({
        transferId: `missing-transfer-${fixtureId}`,

        client: tx,
      }),
    );

    assert.equal(missing, null);

    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: malformedTransferId,

        version: 1,

        status: TREASURY_TRANSFER_STATUS.CREATED,

        snapshot: {
          ...JSON.parse(JSON.stringify(created.aggregate)),

          id: malformedTransferId,

          source: {
            kind: TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY,
          },
        },
      },
    });

    let malformedError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryTransferWithClient({
          transferId: malformedTransferId,

          client: tx,
        }),
      );
    } catch (error: unknown) {
      malformedError = error;
    }

    assertErrorCode(malformedError, "TREASURY_GATEWAY_TRANSFER_SOURCE_INVALID");

    console.log("✓ Treasury Gateway Transfer load smoke test passed");

    console.log({
      transferId,

      status: loaded.aggregate.status,

      version: loaded.aggregate.metadata.version,

      sourceKind: loaded.aggregate.source.kind,

      destinationKind: loaded.aggregate.destination.kind,

      amount: loaded.aggregate.requestedAmount,

      destinationCurrency: loaded.aggregate.destinationCurrency,

      invariants: {
        transferReloaded: true,

        sourceLocationDecoded: true,

        destinationLocationDecoded: true,

        moneyDecoded: true,

        metadataDatesRestored: true,

        missingTransferReturnsNull: true,

        malformedSnapshotRejected: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, malformedTransferId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, malformedTransferId],
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
