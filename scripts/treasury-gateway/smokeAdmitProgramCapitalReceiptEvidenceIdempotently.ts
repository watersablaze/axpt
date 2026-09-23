import assert from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
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
  admitProgramCapitalReceiptEvidenceIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/admitProgramCapitalReceiptEvidenceIdempotentlyWithClient";

import {
  loadProgramCapitalReceiptWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

import {
  loadCapitalReceiptEvidenceWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadCapitalReceiptEvidenceWithClient";

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
    `trv-evidence-receipt-${fixtureId}`;

  const actorId =
    `trv-evidence-reviewer-${fixtureId}`;

  const alternateActorId =
    `trv-evidence-reviewer-alt-${fixtureId}`;

  const transactionHash =
    `0x${fixtureId.replaceAll("-", "")}`;

  const evidenceId =
    `trv-blockchain-evidence-${fixtureId}`;

  const artifactId =
    `trv-blockchain-artifact-${fixtureId}`;

  const recordedAt =
    new Date("2026-09-23T11:03:00.000Z");

  const evidenceKey =
    `trv-evidence-admit-${fixtureId}`;

  try {
    /*
     * ------------------------------------------------------
     * ESTABLISH REPORTED RECEIPT
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
              `TRV-EVIDENCE-${fixtureId}`,

            eventId:
              `trv-evidence-report-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-report-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:00:00.000Z"),

              idempotencyKey:
                `trv-evidence-report-${fixtureId}`,
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
                transactionHash,

              receivedAt:
                new Date("2026-09-23T10:58:00.000Z"),
            },
          },

          client:
            tx,
        });
      },
    );

    /*
     * ------------------------------------------------------
     * ENTER VERIFICATION JURISDICTION
     * ------------------------------------------------------
     */

    const started =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
            receiptId,

            eventId:
              `trv-evidence-verification-start-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-verification-start-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:01:00.000Z"),

              idempotencyKey:
                `trv-evidence-verification-start-${fixtureId}`,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      started.disposition,
      "STARTED",
    );

    assert.equal(
      started.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      started.aggregate.metadata.version,
      2,
    );

    /*
     * ------------------------------------------------------
     * FIRST EVIDENCE ADMISSION
     * ------------------------------------------------------
     */

    const first =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
            receiptId,

            evidenceId,

            evidenceType:
              CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

            artifactId,

            externalReference:
              transactionHash,

            recordedAt,

            eventId:
              `trv-evidence-admitted-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-admitted-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:03:30.000Z"),

              idempotencyKey:
                evidenceKey,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      first.disposition,
      "ADMITTED",
    );

    assert.equal(
      first.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      first.aggregate.metadata.version,
      3,
    );

    assert.equal(
      first.aggregate.verifiedAmount,
      undefined,
    );

    assert.equal(
      first.aggregate.recognizedAmount,
      undefined,
    );

    /*
     * ------------------------------------------------------
     * EXACT RETRY
     *
     * Command metadata changes.
     * Evidence fact does not.
     * ------------------------------------------------------
     */

    const replay =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
            receiptId,

            evidenceId,

            evidenceType:
              CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

            artifactId,

            externalReference:
              transactionHash,

            recordedAt,

            eventId:
              `trv-evidence-replay-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-replay-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-replay-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:04:00.000Z"),

              idempotencyKey:
                evidenceKey,
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
      3,
    );

    /*
     * ------------------------------------------------------
     * SAME COMMAND KEY + DIFFERENT ACTOR
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
          admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
            receiptId,

            evidenceId,

            evidenceType:
              CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

            artifactId,

            externalReference:
              transactionHash,

            recordedAt,

            eventId:
              `trv-evidence-actor-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-actor-collision-command-${fixtureId}`,

              actorId:
                alternateActorId,

              correlationId:
                `trv-evidence-actor-collision-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:05:00.000Z"),

              idempotencyKey:
                evidenceKey,
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
     * SAME COMMAND KEY + CHANGED ARTIFACT
     * ------------------------------------------------------
     */

    let artifactCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
            receiptId,

            evidenceId,

            evidenceType:
              CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

            artifactId:
              `different-artifact-${fixtureId}`,

            externalReference:
              transactionHash,

            recordedAt,

            eventId:
              `trv-evidence-artifact-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-artifact-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-artifact-collision-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:06:00.000Z"),

              idempotencyKey:
                evidenceKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      artifactCollision =
        error;
    }

    assertErrorCode(
      artifactCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * SAME COMMAND KEY + CHANGED RECORDED TIME
     * ------------------------------------------------------
     */

    let recordedAtCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
            receiptId,

            evidenceId,

            evidenceType:
              CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

            artifactId,

            externalReference:
              transactionHash,

            recordedAt:
              new Date("2026-09-23T11:03:01.000Z"),

            eventId:
              `trv-evidence-recorded-at-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-recorded-at-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-recorded-at-collision-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:07:00.000Z"),

              idempotencyKey:
                evidenceKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      recordedAtCollision =
        error;
    }

    assertErrorCode(
      recordedAtCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * SAME EVIDENCE ID + FRESH COMMAND KEY
     *
     * Command idempotency is not the only protection.
     * Canonical evidence identity must reject this as well.
     * ------------------------------------------------------
     */

    let duplicateEvidenceIdentity:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
            receiptId,

            evidenceId,

            evidenceType:
              CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

            artifactId,

            externalReference:
              transactionHash,

            recordedAt,

            eventId:
              `trv-evidence-duplicate-id-event-${fixtureId}`,

            context: {
              commandId:
                `trv-evidence-duplicate-id-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-evidence-duplicate-id-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T11:08:00.000Z"),

              idempotencyKey:
                `trv-evidence-duplicate-id-key-${fixtureId}`,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      duplicateEvidenceIdentity =
        error;
    }

    assertErrorCode(
      duplicateEvidenceIdentity,
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_ID_ALREADY_ADMITTED",
    );

    /*
     * ------------------------------------------------------
     * DURABLE STATE
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
      3,
    );

    assert.equal(
      loaded.aggregate.verifiedAmount,
      undefined,
    );

    assert.equal(
      loaded.aggregate.verifiedAt,
      undefined,
    );

    assert.equal(
      loaded.aggregate.recognizedAmount,
      undefined,
    );

    assert.equal(
      loaded.aggregate.recognizedAt,
      undefined,
    );

    const evidence =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          loadCapitalReceiptEvidenceWithClient({
            receiptId,

            receiptVersion:
              loaded.aggregate.metadata.version,

            client:
              tx,
          }),
      );

    assert.equal(
      evidence.length,
      1,
    );

    assert.equal(
      evidence[0]?.id,
      evidenceId,
    );

    assert.equal(
      evidence[0]?.artifactId,
      artifactId,
    );

    assert.equal(
      evidence[0]?.externalReference,
      transactionHash,
    );

    const [
      evidenceEventCount,
      replayEventCount,
      actorCollisionEventCount,
      artifactCollisionEventCount,
      recordedAtCollisionEventCount,
      duplicateIdentityEventCount,
      evidenceCommandReceiptCount,
      duplicateIdentityCommandReceiptCount,
      verifiedEventCount,
      recognizedEventCount,
    ] =
      await Promise.all([
        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-evidence-replay-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-evidence-actor-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-evidence-artifact-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-evidence-recorded-at-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-evidence-duplicate-id-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.count({
          where: {
            idempotencyKey:
              evidenceKey,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.count({
          where: {
            idempotencyKey:
              `trv-evidence-duplicate-id-key-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
          },
        }),
      ]);

    assert.equal(
      evidenceEventCount,
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
      artifactCollisionEventCount,
      0,
    );

    assert.equal(
      recordedAtCollisionEventCount,
      0,
    );

    assert.equal(
      duplicateIdentityEventCount,
      0,
    );

    assert.equal(
      evidenceCommandReceiptCount,
      1,
    );

    assert.equal(
      duplicateIdentityCommandReceiptCount,
      0,
    );

    assert.equal(
      verifiedEventCount,
      0,
    );

    assert.equal(
      recognizedEventCount,
      0,
    );

    console.log(
      "TRV_EVIDENCE_FIRST_ADMISSION_OK",
    );

    console.log(
      "TRV_EVIDENCE_EXACT_REPLAY_OK",
    );

    console.log(
      "TRV_EVIDENCE_REPLAY_NO_SECOND_EVENT_OK",
    );

    console.log(
      "TRV_EVIDENCE_REPLAY_NO_VERSION_ADVANCE_OK",
    );

    console.log(
      "TRV_EVIDENCE_ACTOR_COLLISION_OK",
    );

    console.log(
      "TRV_EVIDENCE_ARTIFACT_COLLISION_OK",
    );

    console.log(
      "TRV_EVIDENCE_RECORDED_AT_COLLISION_OK",
    );

    console.log(
      "TRV_EVIDENCE_IDENTITY_DUPLICATE_REJECTED_OK",
    );

    console.log(
      "TRV_EVIDENCE_EXACTLY_ONE_DURABLE_EVIDENCE_OK",
    );

    console.log(
      "TRV_EVIDENCE_RECEIPT_REMAINS_UNDER_VERIFICATION_OK",
    );

    console.log(
      "TRV_EVIDENCE_DOES_NOT_VERIFY_RECEIPT_OK",
    );

    console.log(
      "TRV_EVIDENCE_DOES_NOT_RECOGNIZE_CAPITAL_OK",
    );
  } finally {
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
