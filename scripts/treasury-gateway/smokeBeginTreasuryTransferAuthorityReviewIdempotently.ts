import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { beginTreasuryTransferAuthorityReviewIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewIdempotentlyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

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

  const transferId = `smoke-idempotent-review-transfer-${fixtureId}`;

  const actorId = `smoke-idempotent-review-actor-${fixtureId}`;

  const idempotencyKey = `smoke-idempotent-review-${fixtureId}`;

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferDurablyWithClient({
        request: {
          transferId,

          reference: `AXPT-IDEMPOTENT-REVIEW-${fixtureId}`,

          eventId: `smoke-idempotent-review-created-event-${fixtureId}`,

          context: {
            commandId: `smoke-idempotent-review-create-command-${fixtureId}`,

            actorId,

            correlationId: `smoke-idempotent-review-create-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `smoke-idempotent-review-create-${fixtureId}`,
          },

          payload: {
            programId: `smoke-idempotent-review-program-${fixtureId}`,

            source: {
              kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

              programAccountId: `smoke-idempotent-review-account-${fixtureId}`,
            },

            destination: {
              kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

              settlementEndpointId: `smoke-idempotent-review-endpoint-${fixtureId}`,
            },

            requestedAmount: {
              amount: "175000.00",

              currency: "USD",
            },

            destinationCurrency: "USD",

            purpose: "Idempotent authority review initiation smoke",
          },
        },

        client: tx,
      }),
    );

    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      beginTreasuryTransferAuthorityReviewIdempotentlyWithClient({
        transferId,

        eventId: `smoke-idempotent-review-start-event-${fixtureId}`,

        context: {
          commandId: `smoke-idempotent-review-start-command-${fixtureId}`,

          actorId,

          correlationId: `smoke-idempotent-review-correlation-${fixtureId}`,

          requestedAt: new Date(),

          idempotencyKey,
        },

        client: tx,
      }),
    );

    assert.equal(first.disposition, "STARTED");

    assert.equal(
      first.aggregate.status,
      TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW,
    );

    assert.equal(first.aggregate.metadata.version, 2);

    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      beginTreasuryTransferAuthorityReviewIdempotentlyWithClient({
        transferId,

        eventId: `smoke-idempotent-review-retry-event-${fixtureId}`,

        context: {
          commandId: `smoke-idempotent-review-retry-command-${fixtureId}`,

          actorId,

          correlationId: `smoke-idempotent-review-retry-correlation-${fixtureId}`,

          requestedAt: new Date(),

          idempotencyKey,
        },

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(retry.aggregate.id, transferId);

    assert.equal(
      retry.aggregate.status,
      TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW,
    );

    assert.equal(retry.aggregate.metadata.version, 2);

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(eventCount, 2);

    assert.equal(receiptCount, 1);

    let collisionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        beginTreasuryTransferAuthorityReviewIdempotentlyWithClient({
          transferId,

          eventId: `smoke-idempotent-review-collision-event-${fixtureId}`,

          context: {
            commandId: `smoke-idempotent-review-collision-command-${fixtureId}`,

            actorId: `different-actor-${fixtureId}`,

            correlationId: `smoke-idempotent-review-collision-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      collisionError = error;
    }

    assertErrorCode(
      collisionError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    const eventCountAfterCollision = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    assert.equal(eventCountAfterCollision, 2);

    console.log(
      "✓ Idempotent Treasury Transfer authority review initiation smoke test passed",
    );

    console.log({
      transferId,

      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      status: retry.aggregate.status,

      version: retry.aggregate.metadata.version,

      counts: {
        events: eventCount,

        receipts: receiptCount,
      },

      invariants: {
        createdTransferRequired: true,

        firstRequestStartsAuthorityReview: true,

        reviewTransitionPersistedOnce: true,

        commandReceiptPersisted: true,

        exactRetryReturnsExistingTransfer: true,

        exactRetryDoesNotAdvanceVersion: true,

        exactRetryDoesNotAppendEvent: true,

        changedRequestWithSameKeyRejected: true,

        collisionAppendsNoEvent: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        idempotencyKey,
      },
    });

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
