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
  verifyProgramCapitalReceiptIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/verifyProgramCapitalReceiptIdempotentlyWithClient";

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
    `trv-judgment-receipt-${fixtureId}`;

  const actorId =
    `trv-judgment-reviewer-${fixtureId}`;

  const alternateActorId =
    `trv-judgment-reviewer-alt-${fixtureId}`;

  const transactionHash =
    `0x${fixtureId.replaceAll("-", "")}`;

  const blockchainEvidenceId =
    `trv-judgment-blockchain-evidence-${fixtureId}`;

  const operatorEvidenceId =
    `trv-judgment-operator-evidence-${fixtureId}`;

  const blockchainArtifactId =
    `trv-judgment-blockchain-artifact-${fixtureId}`;

  const operatorArtifactId =
    `trv-judgment-operator-artifact-${fixtureId}`;

  const verifiedAt =
    new Date("2026-09-23T12:10:00.000Z");

  const verifyKey =
    `trv-judgment-verify-${fixtureId}`;

  try {
    /*
     * ------------------------------------------------------
     * 1. ESTABLISH CANONICAL REPORTED RECEIPT
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
              `TRV-JUDGMENT-${fixtureId}`,

            eventId:
              `trv-judgment-report-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-report-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:00:00.000Z"),

              idempotencyKey:
                `trv-judgment-report-${fixtureId}`,
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
                new Date("2026-09-23T11:58:00.000Z"),
            },
          },

          client:
            tx,
        });
      },
    );

    /*
     * ------------------------------------------------------
     * 2. ENTER VERIFICATION
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
              `trv-judgment-start-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-start-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:01:00.000Z"),

              idempotencyKey:
                `trv-judgment-start-${fixtureId}`,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      started.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    /*
     * ------------------------------------------------------
     * 3. ADMIT BLOCKCHAIN EVIDENCE
     * ------------------------------------------------------
     */

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
          receiptId,

          evidenceId:
            blockchainEvidenceId,

          evidenceType:
            CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

          artifactId:
            blockchainArtifactId,

          externalReference:
            transactionHash,

          recordedAt:
            new Date("2026-09-23T12:03:00.000Z"),

          eventId:
            `trv-judgment-blockchain-evidence-event-${fixtureId}`,

          context: {
            commandId:
              `trv-judgment-blockchain-evidence-command-${fixtureId}`,

            actorId,

            correlationId:
              `trv-judgment-correlation-${fixtureId}`,

            requestedAt:
              new Date("2026-09-23T12:03:30.000Z"),

            idempotencyKey:
              `trv-judgment-blockchain-evidence-${fixtureId}`,
          },

          client:
            tx,
        }),
    );

    /*
     * ------------------------------------------------------
     * 4. ADMIT OPERATOR EVIDENCE
     * ------------------------------------------------------
     */

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
          receiptId,

          evidenceId:
            operatorEvidenceId,

          evidenceType:
            CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

          artifactId:
            operatorArtifactId,

          recordedAt:
            new Date("2026-09-23T12:04:00.000Z"),

          eventId:
            `trv-judgment-operator-evidence-event-${fixtureId}`,

          context: {
            commandId:
              `trv-judgment-operator-evidence-command-${fixtureId}`,

            actorId,

            correlationId:
              `trv-judgment-correlation-${fixtureId}`,

            requestedAt:
              new Date("2026-09-23T12:04:30.000Z"),

            idempotencyKey:
              `trv-judgment-operator-evidence-${fixtureId}`,
          },

          client:
            tx,
        }),
    );

    /*
     * Receipt should now be version 4:
     *
     * v1 REPORTED
     * v2 UNDER_VERIFICATION
     * v3 evidence A
     * v4 evidence B
     */

    const preJudgment =
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
      preJudgment,
    );

    assert.equal(
      preJudgment.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      preJudgment.aggregate.metadata.version,
      4,
    );

    /*
     * ------------------------------------------------------
     * 5. FIRST VERIFICATION JUDGMENT
     * ------------------------------------------------------
     *
     * Deliberately verify less than declared.
     * Verification records discovered fact rather than
     * forcing declaration and verified reality to coincide.
     * ------------------------------------------------------
     */

    const first =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
              operatorEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-verified-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-verified-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:10:30.000Z"),

              idempotencyKey:
                verifyKey,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      first.disposition,
      "VERIFIED",
    );

    assert.equal(
      first.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
    );

    assert.equal(
      first.aggregate.metadata.version,
      5,
    );

    assert.deepEqual(
      first.aggregate.verifiedAmount,
      {
        amount:
          "471800.00",

        currency:
          "USDT",
      },
    );

    assert.equal(
      first.aggregate.recognizedAmount,
      undefined,
    );

    assert.equal(
      first.aggregate.recognizedAt,
      undefined,
    );

    /*
     * ------------------------------------------------------
     * 6. EXACT RETRY
     * ------------------------------------------------------
     */

    const replay =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
              operatorEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-replay-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-replay-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-replay-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:11:00.000Z"),

              idempotencyKey:
                verifyKey,
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
      PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
    );

    assert.equal(
      replay.aggregate.metadata.version,
      5,
    );

    /*
     * ------------------------------------------------------
     * 7. REVERSED EVIDENCE ORDER
     *
     * Same semantic evidence set must replay.
     * ------------------------------------------------------
     */

    const reorderedReplay =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              operatorEvidenceId,
              blockchainEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-reordered-replay-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-reordered-replay-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-reordered-replay-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:12:00.000Z"),

              idempotencyKey:
                verifyKey,
            },

            client:
              tx,
          }),
      );

    assert.equal(
      reorderedReplay.disposition,
      "REPLAYED",
    );

    assert.equal(
      reorderedReplay.aggregate.metadata.version,
      5,
    );

    /*
     * ------------------------------------------------------
     * 8. SAME KEY + DIFFERENT ACTOR
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
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
              operatorEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-actor-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-actor-collision-command-${fixtureId}`,

              actorId:
                alternateActorId,

              correlationId:
                `trv-judgment-actor-collision-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:13:00.000Z"),

              idempotencyKey:
                verifyKey,
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
     * 9. SAME KEY + DIFFERENT AMOUNT
     * ------------------------------------------------------
     */

    let amountCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471799.99",

              currency:
                "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
              operatorEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-amount-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-amount-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-amount-collision-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:14:00.000Z"),

              idempotencyKey:
                verifyKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      amountCollision =
        error;
    }

    assertErrorCode(
      amountCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * 10. SAME KEY + DIFFERENT CURRENCY
     * ------------------------------------------------------
     */

    let currencyCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USD",
            },

            evidenceIds: [
              blockchainEvidenceId,
              operatorEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-currency-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-currency-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-currency-collision-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:15:00.000Z"),

              idempotencyKey:
                verifyKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      currencyCollision =
        error;
    }

    assertErrorCode(
      currencyCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * 11. SAME KEY + DIFFERENT EVIDENCE MEMBERSHIP
     * ------------------------------------------------------
     */

    let evidenceMembershipCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
            ],

            verifiedAt,

            eventId:
              `trv-judgment-evidence-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-evidence-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-evidence-collision-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:16:00.000Z"),

              idempotencyKey:
                verifyKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      evidenceMembershipCollision =
        error;
    }

    assertErrorCode(
      evidenceMembershipCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * 12. SAME KEY + DIFFERENT VERIFIED-AT
     * ------------------------------------------------------
     */

    let verifiedAtCollision:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId,

            verifiedAmount: {
              amount:
                "471800.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
              operatorEvidenceId,
            ],

            verifiedAt:
              new Date("2026-09-23T12:10:01.000Z"),

            eventId:
              `trv-judgment-time-collision-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-time-collision-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-time-collision-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:17:00.000Z"),

              idempotencyKey:
                verifyKey,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      verifiedAtCollision =
        error;
    }

    assertErrorCode(
      verifiedAtCollision,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * ------------------------------------------------------
     * 13. CANONICAL DOMAIN NEGATIVE TESTS
     *
     * These require a separate receipt because the first
     * receipt is already VERIFIED.
     * ------------------------------------------------------
     */

    const negativeReceiptId =
      `trv-judgment-negative-${fixtureId}`;

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) => {
        await reportProgramCapitalReceiptIdempotentlyWithClient({
          request: {
            receiptId:
              negativeReceiptId,

            reference:
              `TRV-JUDGMENT-NEGATIVE-${fixtureId}`,

            eventId:
              `trv-judgment-negative-report-event-${fixtureId}`,

            context: {
              commandId:
                `trv-judgment-negative-report-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-judgment-negative-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:20:00.000Z"),

              idempotencyKey:
                `trv-judgment-negative-report-${fixtureId}`,
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
                `0xnegative${fixtureId.replaceAll("-", "")}`,

              receivedAt:
                new Date("2026-09-23T12:19:00.000Z"),
            },
          },

          client:
            tx,
        });
      },
    );

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
          receiptId:
            negativeReceiptId,

          eventId:
            `trv-judgment-negative-start-event-${fixtureId}`,

          context: {
            commandId:
              `trv-judgment-negative-start-command-${fixtureId}`,

            actorId,

            correlationId:
              `trv-judgment-negative-correlation-${fixtureId}`,

            requestedAt:
              new Date("2026-09-23T12:21:00.000Z"),

            idempotencyKey:
              `trv-judgment-negative-start-${fixtureId}`,
          },

          client:
            tx,
        }),
    );

    const negativeEvidenceId =
      `trv-negative-admitted-evidence-${fixtureId}`;

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
          receiptId:
            negativeReceiptId,

          evidenceId:
            negativeEvidenceId,

          evidenceType:
            CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

          artifactId:
            `trv-negative-artifact-${fixtureId}`,

          externalReference:
            `0xnegative${fixtureId.replaceAll("-", "")}`,

          recordedAt:
            new Date("2026-09-23T12:22:00.000Z"),

          eventId:
            `trv-negative-evidence-event-${fixtureId}`,

          context: {
            commandId:
              `trv-negative-evidence-command-${fixtureId}`,

            actorId,

            correlationId:
              `trv-judgment-negative-correlation-${fixtureId}`,

            requestedAt:
              new Date("2026-09-23T12:22:30.000Z"),

            idempotencyKey:
              `trv-negative-evidence-${fixtureId}`,
          },

          client:
            tx,
        }),
    );

    /*
     * Unadmitted evidence must fail.
     */

    let unadmittedEvidenceError:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId:
              negativeReceiptId,

            verifiedAmount: {
              amount:
                "50.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              `never-admitted-${fixtureId}`,
            ],

            verifiedAt:
              new Date("2026-09-23T12:23:00.000Z"),

            eventId:
              `trv-unadmitted-evidence-event-${fixtureId}`,

            context: {
              commandId:
                `trv-unadmitted-evidence-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-unadmitted-evidence-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:23:00.000Z"),

              idempotencyKey:
                `trv-unadmitted-evidence-${fixtureId}`,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      unadmittedEvidenceError =
        error;
    }

    assertErrorCode(
      unadmittedEvidenceError,
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVIDENCE_NOT_ADMITTED",
    );

    /*
     * Duplicate selected evidence must fail.
     */

    let duplicateEvidenceSelectionError:
      unknown;

    try {
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          verifyProgramCapitalReceiptIdempotentlyWithClient({
            receiptId:
              negativeReceiptId,

            verifiedAmount: {
              amount:
                "50.00",

              currency:
                "USDT",
            },

            evidenceIds: [
              negativeEvidenceId,
              negativeEvidenceId,
            ],

            verifiedAt:
              new Date("2026-09-23T12:24:00.000Z"),

            eventId:
              `trv-duplicate-selection-event-${fixtureId}`,

            context: {
              commandId:
                `trv-duplicate-selection-command-${fixtureId}`,

              actorId,

              correlationId:
                `trv-duplicate-selection-correlation-${fixtureId}`,

              requestedAt:
                new Date("2026-09-23T12:24:00.000Z"),

              idempotencyKey:
                `trv-duplicate-selection-${fixtureId}`,
            },

            client:
              tx,
          }),
      );
    } catch (
      error:
        unknown
    ) {
      duplicateEvidenceSelectionError =
        error;
    }

    assertErrorCode(
      duplicateEvidenceSelectionError,
      "PROGRAM_CAPITAL_RECEIPT_VERIFICATION_EVIDENCE_DUPLICATE",
    );

    /*
     * ------------------------------------------------------
     * 14. VERIFY FINAL DURABLE STATE
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
      PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
    );

    assert.equal(
      loaded.aggregate.metadata.version,
      5,
    );

    assert.deepEqual(
      loaded.aggregate.verifiedAmount,
      {
        amount:
          "471800.00",

        currency:
          "USDT",
      },
    );

    assert.equal(
      loaded.aggregate.recognizedAmount,
      undefined,
    );

    assert.equal(
      loaded.aggregate.recognizedAt,
      undefined,
    );

    const [
      verifiedEventCount,
      recognizedEventCount,
      replayEventCount,
      reorderedReplayEventCount,
      actorCollisionEventCount,
      amountCollisionEventCount,
      currencyCollisionEventCount,
      evidenceCollisionEventCount,
      verifiedAtCollisionEventCount,
      verifyCommandReceiptCount,
      unadmittedCommandReceiptCount,
      duplicateSelectionCommandReceiptCount,
    ] =
      await Promise.all([
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

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-replay-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-reordered-replay-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-actor-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-amount-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-currency-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-evidence-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            eventId:
              `trv-judgment-time-collision-event-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.count({
          where: {
            idempotencyKey:
              verifyKey,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.count({
          where: {
            idempotencyKey:
              `trv-unadmitted-evidence-${fixtureId}`,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.count({
          where: {
            idempotencyKey:
              `trv-duplicate-selection-${fixtureId}`,
          },
        }),
      ]);

    assert.equal(
      verifiedEventCount,
      1,
    );

    assert.equal(
      recognizedEventCount,
      0,
    );

    assert.equal(
      replayEventCount,
      0,
    );

    assert.equal(
      reorderedReplayEventCount,
      0,
    );

    assert.equal(
      actorCollisionEventCount,
      0,
    );

    assert.equal(
      amountCollisionEventCount,
      0,
    );

    assert.equal(
      currencyCollisionEventCount,
      0,
    );

    assert.equal(
      evidenceCollisionEventCount,
      0,
    );

    assert.equal(
      verifiedAtCollisionEventCount,
      0,
    );

    assert.equal(
      verifyCommandReceiptCount,
      1,
    );

    assert.equal(
      unadmittedCommandReceiptCount,
      0,
    );

    assert.equal(
      duplicateSelectionCommandReceiptCount,
      0,
    );

    const negativeLoaded =
      await prisma.$transaction(
        async (
          tx:
            TransactionClient,
        ) =>
          loadProgramCapitalReceiptWithClient({
            receiptId:
              negativeReceiptId,

            client:
              tx,
          }),
      );

    assert(
      negativeLoaded,
    );

    assert.equal(
      negativeLoaded.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      negativeLoaded.aggregate.verifiedAmount,
      undefined,
    );

    console.log(
      "TRV_JUDGMENT_FIRST_VERIFICATION_OK",
    );

    console.log(
      "TRV_JUDGMENT_EXACT_REPLAY_OK",
    );

    console.log(
      "TRV_JUDGMENT_REORDERED_EVIDENCE_REPLAY_OK",
    );

    console.log(
      "TRV_JUDGMENT_REPLAY_NO_SECOND_EVENT_OK",
    );

    console.log(
      "TRV_JUDGMENT_REPLAY_NO_VERSION_ADVANCE_OK",
    );

    console.log(
      "TRV_JUDGMENT_ACTOR_COLLISION_OK",
    );

    console.log(
      "TRV_JUDGMENT_AMOUNT_COLLISION_OK",
    );

    console.log(
      "TRV_JUDGMENT_CURRENCY_COLLISION_OK",
    );

    console.log(
      "TRV_JUDGMENT_EVIDENCE_MEMBERSHIP_COLLISION_OK",
    );

    console.log(
      "TRV_JUDGMENT_VERIFIED_AT_COLLISION_OK",
    );

    console.log(
      "TRV_JUDGMENT_UNADMITTED_EVIDENCE_REJECTED_OK",
    );

    console.log(
      "TRV_JUDGMENT_DUPLICATE_EVIDENCE_SELECTION_REJECTED_OK",
    );

    console.log(
      "TRV_JUDGMENT_EXACTLY_ONE_VERIFIED_EVENT_OK",
    );

    console.log(
      "TRV_JUDGMENT_EXACTLY_ONE_COMMAND_RECEIPT_OK",
    );

    console.log(
      "TRV_JUDGMENT_RECEIPT_REMAINS_VERIFIED_OK",
    );

    console.log(
      "TRV_JUDGMENT_VERIFIED_CAPITAL_REMAINS_UNRECOGNIZED_OK",
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
