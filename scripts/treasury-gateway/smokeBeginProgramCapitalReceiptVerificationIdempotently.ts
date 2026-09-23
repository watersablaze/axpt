import assert from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_METHOD,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
} from "../../src/domains/treasury/gateway/capital-receipts/status";

import {
  reportProgramCapitalReceiptIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

import {
  beginProgramCapitalReceiptVerificationIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationIdempotentlyWithClient";

import {
  loadProgramCapitalReceiptWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  TREASURY_EVENT_TYPE,
} from "../../src/domains/treasury/gateway/events/eventType";

const prisma =
  new PrismaClient();

function assertErrorCode(
  error:
    unknown,

  code:
    string,
): void {
  assert(
    error instanceof Error,
  );

  assert(
    error.message.includes(
      code,
    ),
    `Expected ${code}, received ${error.message}`,
  );
}

async function main():
  Promise<void> {
  const fixtureId =
    randomUUID();

  const receiptId =
    `trv-start-receipt-${fixtureId}`;

  const secondReceiptId =
    `trv-start-second-receipt-${fixtureId}`;

  const actorId =
    `trv-reviewer-${fixtureId}`;

  const alternateActorId =
    `trv-reviewer-alt-${fixtureId}`;

  const beginKey =
    `trv-begin-${fixtureId}`;

  const beginCommandId =
    `trv-begin-command-${fixtureId}`;

  const beginCorrelationId =
    `trv-begin-correlation-${fixtureId}`;

  const beginEventId =
    `trv-begin-event-${fixtureId}`;

  try {
    /*
     * ------------------------------------------------------
     * ESTABLISH CANONICAL REPORTED RECEIPT
     * ------------------------------------------------------
     */

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) => {
        await reportProgramCapitalReceiptIdempotentlyWithClient({
          request: {
            receiptId,

            reference:
              `TRV-REPORTED-${fixtureId}`,

            eventId:
              `trv-report-event-${fixtureId}`,

            context: {
              commandId:
                `trv-report-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-report-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T10:00:00.000Z"),

              idempotencyKey:
                `trv-report-${fixtureId}`,
            },

            payload: {
              programId:
                `program-${fixtureId}`,

              destinationProgramAccountId:
                `program-account-${fixtureId}`,

              declaredAmount: {
                amount:
                  "471812.40",

                currency:
                  "USDT",
              },

              receiptMethod:
                CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

              externalReference:
                `0x${fixtureId.replaceAll("-", "")}`,

              receivedAt:
                new Date("2026-09-23T09:58:00.000Z"),
            },
          },

          client:
            tx,
        });
      },
    );

    /*
     * ------------------------------------------------------
     * FIRST BEGIN-VERIFICATION
     * ------------------------------------------------------
     */

    const first =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
            receiptId,

            eventId:
              beginEventId,

            context: {
              commandId:
                beginCommandId,

              actorId,

              correlationId:
                beginCorrelationId,

              requestedAt:
                new Date("2026-09-23T10:01:00.000Z"),

              idempotencyKey:
                beginKey,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      first.disposition,
      "STARTED",
    );

    assert.equal(
      first.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      first.aggregate.metadata.version,
      2,
    );

    /*
     * ------------------------------------------------------
     * EXACT REPLAY
     *
     * eventId / commandId / correlationId / requestedAt may
     * differ operationally. Semantic identity remains:
     * actorId + receiptId + idempotencyKey.
     * ------------------------------------------------------
     */

    const replay =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
            receiptId,

            eventId:
              `trv-begin-replay-event-${fixtureId}`,

            context: {
              commandId:
                `trv-begin-replay-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-begin-replay-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T10:02:00.000Z"),

              idempotencyKey:
                beginKey,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      replay.disposition,
      "REPLAYED",
    );

    assert.equal(
      replay.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      replay.aggregate.metadata.version,
      2,
    );

    /*
     * ------------------------------------------------------
     * SAME KEY + DIFFERENT ACTOR
     * ------------------------------------------------------
     */

    let actorCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
            receiptId,

            eventId:
              `trv-begin-actor-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-begin-actor-collision-command-${fixtureId}`,

              actorId:
                alternateActorId,

              correlationId:
                `trv-begin-actor-collision-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T10:03:00.000Z"),

              idempotencyKey:
                beginKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      actorCollision =
        error;
    }

    assertErrorCode(
      actorCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * ESTABLISH SECOND REPORTED RECEIPT
     * ------------------------------------------------------
     */

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) => {
        await reportProgramCapitalReceiptIdempotentlyWithClient({
          request: {
            receiptId:
              secondReceiptId,

            reference:
              `TRV-REPORTED-SECOND-${fixtureId}`,

            eventId:
              `trv-report-second-event-${fixtureId}`,

            context: {
              commandId:
                `trv-report-second-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-report-second-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T10:04:00.000Z"),

              idempotencyKey:
                `trv-report-second-${fixtureId}`,
            },

            payload: {
              programId:
                `program-${fixtureId}`,

              destinationProgramAccountId:
                `program-account-${fixtureId}`,

              declaredAmount: {
                amount:
                  "50.00",

                currency:
                  "USDT",
              },

              receiptMethod:
                CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

              externalReference:
                `0xsecond${fixtureId.replaceAll("-", "")}`,

              receivedAt:
                new Date("2026-09-23T10:04:00.000Z"),
            },
          },

          client:
            tx,
        });
      },
    );

    /*
     * ------------------------------------------------------
     * SAME KEY + DIFFERENT RECEIPT
     * ------------------------------------------------------
     */

    let receiptCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
            receiptId:
              secondReceiptId,

            eventId:
              `trv-begin-receipt-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-begin-receipt-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-begin-receipt-collision-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T10:05:00.000Z"),

              idempotencyKey:
                beginKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      receiptCollision =
        error;
    }

    assertErrorCode(
      receiptCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * VERIFY DURABLE STATE
     * ------------------------------------------------------
     */

    const loaded =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          loadProgramCapitalReceiptWithClient({
            receiptId,

            client:
              tx,
          }),
      );

    assert(
      loaded,
    );

    assert.equal(
      loaded.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      loaded.aggregate.metadata.version,
      2,
    );

    const [
      verificationStartedEvents,
      replayEventCount,
      actorCollisionEventCount,
      receiptCollisionEventCount,
      beginCommandReceipts,
    ] =
      await Promise.all([
        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-begin-replay-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-begin-actor-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-begin-receipt-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.count({
          where: {
            idempotencyKey:
              beginKey,
          },
        }),
      ]);

    assert.equal(
      verificationStartedEvents,
      1,
    );

    assert.equal(
      replayEventCount,
      0,
    );

    assert.equal(
      actorCollisionEventCount,
      0,
    );

    assert.equal(
      receiptCollisionEventCount,
      0,
    );

    assert.equal(
      beginCommandReceipts,
      1,
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_FIRST_START_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_EXACT_REPLAY_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_REPLAY_NO_SECOND_EVENT_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_REPLAY_NO_VERSION_ADVANCE_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_ACTOR_COLLISION_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_RECEIPT_COLLISION_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_ONE_COMMAND_RECEIPT_OK",
    );

    console.log(
      "TRV_BEGIN_VERIFICATION_STOPS_AT_UNDER_VERIFICATION_OK",
    );
  } finally {
    /*
     * Fixture-only cleanup.
     */
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        OR: [
          {
            idempotencyKey: {
              contains:
                fixtureId,
            },
          },

          {
            correlationId: {
              contains:
                fixtureId,
            },
          },
        ],
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: {
          contains:
            fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: {
          contains:
            fixtureId,
        },
      },
    });
  }
}

main()
  .catch(
    (
      error:
        unknown,
    ) => {
      console.error(
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
