import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { loadTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/loadTreasuryTransferWithClient";

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

  const transferId = `smoke-review-transfer-${fixtureId}`;

  const createdEventId = `smoke-review-created-event-${fixtureId}`;

  const reviewEventId = `smoke-review-started-event-${fixtureId}`;

  const actorId = `smoke-review-actor-${fixtureId}`;

  const createdAt = new Date("2026-08-19T13:15:00.000Z");

  const reviewedAt = new Date("2026-08-19T13:20:00.000Z");

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferDurablyWithClient({
        request: {
          transferId,

          reference: `AXPT-REVIEW-${fixtureId}`,

          eventId: createdEventId,

          context: {
            commandId: `smoke-review-create-command-${fixtureId}`,

            actorId,

            correlationId: `smoke-review-correlation-${fixtureId}`,

            requestedAt: createdAt,

            idempotencyKey: `smoke-review-create-${fixtureId}`,
          },

          payload: {
            programId: `smoke-review-program-${fixtureId}`,

            source: {
              kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

              programAccountId: `smoke-review-account-${fixtureId}`,
            },

            destination: {
              kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

              settlementEndpointId: `smoke-review-endpoint-${fixtureId}`,
            },

            requestedAmount: {
              amount: "125000.00",

              currency: "USD",
            },

            destinationCurrency: "USD",

            purpose: "Durable authority review initiation smoke",
          },
        },

        client: tx,
      }),
    );

    const reviewed = await prisma.$transaction(async (tx: TransactionClient) =>
      beginTreasuryTransferAuthorityReviewDurablyWithClient({
        transferId,

        eventId: reviewEventId,

        context: {
          commandId: `smoke-review-start-command-${fixtureId}`,

          actorId,

          correlationId: `smoke-review-correlation-${fixtureId}`,

          causationId: `smoke-review-create-command-${fixtureId}`,

          requestedAt: reviewedAt,

          idempotencyKey: `smoke-review-start-${fixtureId}`,
        },

        client: tx,
      }),
    );

    assert.equal(
      reviewed.aggregate.status,
      TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW,
    );

    assert.equal(reviewed.aggregate.metadata.version, 2);

    assert.equal(
      reviewed.aggregate.metadata.updatedAt.getTime(),
      reviewedAt.getTime(),
    );

    assert.equal(reviewed.aggregate.metadata.lastModifiedByActorId, actorId);

    assert.equal(
      reviewed.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_REVIEW_STARTED,
    );

    assert.equal(reviewed.event.aggregateVersion, 2);

    assert.equal(reviewed.event.actorId, actorId);

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryTransferWithClient({
        transferId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(
      loaded.aggregate.status,
      TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW,
    );

    assert.equal(loaded.aggregate.metadata.version, 2);

    let repeatError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        beginTreasuryTransferAuthorityReviewDurablyWithClient({
          transferId,

          eventId: `smoke-review-repeat-event-${fixtureId}`,

          context: {
            commandId: `smoke-review-repeat-command-${fixtureId}`,

            actorId,

            correlationId: `smoke-review-repeat-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `smoke-review-repeat-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      repeatError = error;
    }

    assertErrorCode(repeatError, "TREASURY_TRANSFER_TRANSITION_INVALID");

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    assert.equal(eventCount, 2);

    console.log(
      "✓ Durable Treasury Transfer authority review initiation smoke test passed",
    );

    console.log({
      transferId,

      status: loaded.aggregate.status,

      version: loaded.aggregate.metadata.version,

      eventType: reviewed.event.eventType,

      invariants: {
        createdTransferRequired: true,

        authorityReviewStarted: true,

        transferAdvancedToVersionTwo: true,

        reviewEventPersisted: true,

        authenticatedActorRetained: true,

        durableReloadReflectsReview: true,

        repeatedReviewInitiationRejected: true,

        failedRepeatAppendsNoEvent: true,
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
