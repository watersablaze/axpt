import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { reportProgramCapitalReceiptIdempotentlyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

import { beginProgramCapitalReceiptVerificationDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationDurablyWithClient";

import { CAPITAL_RECEIPT_METHOD } from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import { loadProgramCapitalReceiptWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../../src/domains/treasury/gateway/capital-receipts/status";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

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

  const receiptId = `capital-receipt-verification-${fixtureId}`;

  const missingReceiptId = `capital-receipt-verification-missing-${fixtureId}`;

  const actorId = `capital-receipt-verification-operator-${fixtureId}`;

  const reportIdempotencyKey = `capital-receipt-verification-report-${fixtureId}`;

  try {
    /*
     * Establish the canonical observed receipt.
     *
     * Reporting records the external value observation only.
     * It must not verify or recognize Treasury capital.
     */
    const reported = await prisma.$transaction(async (tx: TransactionClient) =>
      reportProgramCapitalReceiptIdempotentlyWithClient({
        request: {
          receiptId,

          reference: `DONGIN-USDT-VERIFICATION-${fixtureId}`,

          eventId: `capital-receipt-verification-reported-event-${fixtureId}`,

          context: {
            commandId: `capital-receipt-verification-report-command-${fixtureId}`,

            actorId,

            correlationId: `capital-receipt-verification-report-correlation-${fixtureId}`,

            requestedAt: new Date("2026-09-03T14:01:00.000Z"),

            idempotencyKey: reportIdempotencyKey,
          },

          payload: {
            programId: `dongin-program-${fixtureId}`,

            destinationProgramAccountId: `dongin-usdt-program-account-${fixtureId}`,

            receivedFromPartyId: `dongin-party-${fixtureId}`,

            declaredAmount: {
              amount: "600000.00",

              currency: "USDT",
            },

            receiptMethod: CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

            externalReference: `0x${fixtureId.replace(/-/g, "")}`,

            expectedAt: new Date("2026-09-03T13:30:00.000Z"),

            receivedAt: new Date("2026-09-03T14:00:00.000Z"),
          },
        },

        client: tx,
      }),
    );

    assert.equal(reported.disposition, "REPORTED");

    assert.equal(
      reported.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
    );

    assert.equal(reported.aggregate.metadata.version, 1);

    assert.equal(reported.aggregate.verifiedAmount, undefined);
    assert.equal(reported.aggregate.recognizedAmount, undefined);
    assert.equal(reported.aggregate.verifiedAt, undefined);
    assert.equal(reported.aggregate.recognizedAt, undefined);

    /*
     * Missing canonical receipt must be rejected.
     */
    let missingReceiptError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        beginProgramCapitalReceiptVerificationDurablyWithClient({
          receiptId: missingReceiptId,

          eventId: `capital-receipt-verification-missing-event-${fixtureId}`,

          context: {
            commandId: `capital-receipt-verification-missing-command-${fixtureId}`,

            actorId,

            correlationId: `capital-receipt-verification-missing-correlation-${fixtureId}`,

            requestedAt: new Date("2026-09-03T14:04:00.000Z"),

            idempotencyKey: `capital-receipt-verification-missing-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingReceiptError = error;
    }

    assertErrorCode(
      missingReceiptError,
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_NOT_FOUND",
    );

    /*
     * Begin governed verification.
     *
     * This advances the receipt from REPORTED to UNDER_VERIFICATION.
     * It still does not establish verified or recognized capital.
     */
    const verificationStartedAt = new Date("2026-09-03T14:05:00.000Z");

    const started = await prisma.$transaction(async (tx: TransactionClient) =>
      beginProgramCapitalReceiptVerificationDurablyWithClient({
        receiptId,

        eventId: `capital-receipt-verification-started-event-${fixtureId}`,

        context: {
          commandId: `capital-receipt-verification-start-command-${fixtureId}`,

          actorId,

          correlationId: `capital-receipt-verification-start-correlation-${fixtureId}`,

          requestedAt: verificationStartedAt,

          idempotencyKey: `capital-receipt-verification-start-${fixtureId}`,
        },

        client: tx,
      }),
    );

    assert.equal(started.aggregate.id, receiptId);

    assert.equal(
      started.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(started.aggregate.metadata.version, 2);

    assert.deepEqual(started.aggregate.declaredAmount, {
      amount: "600000.00",

      currency: "USDT",
    });

    assert.equal(
      started.aggregate.externalReference,
      reported.aggregate.externalReference,
    );

    assert.equal(started.aggregate.verifiedAmount, undefined);
    assert.equal(started.aggregate.recognizedAmount, undefined);
    assert.equal(started.aggregate.verifiedAt, undefined);
    assert.equal(started.aggregate.recognizedAt, undefined);

    /*
     * Canonical durable reload.
     */
    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(
      loaded.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(loaded.aggregate.metadata.version, 2);

    assert.deepEqual(loaded.aggregate.declaredAmount, {
      amount: "600000.00",

      currency: "USDT",
    });

    assert.equal(
      loaded.aggregate.externalReference,
      reported.aggregate.externalReference,
    );

    assert.equal(loaded.aggregate.verifiedAmount, undefined);
    assert.equal(loaded.aggregate.recognizedAmount, undefined);
    assert.equal(loaded.aggregate.verifiedAt, undefined);
    assert.equal(loaded.aggregate.recognizedAt, undefined);

    /*
     * A second begin-verification attempt is an invalid state transition.
     *
     * UNDER_VERIFICATION cannot transition to UNDER_VERIFICATION.
     */
    let repeatedTransitionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        beginProgramCapitalReceiptVerificationDurablyWithClient({
          receiptId,

          eventId: `capital-receipt-verification-repeated-event-${fixtureId}`,

          context: {
            commandId: `capital-receipt-verification-repeated-command-${fixtureId}`,

            actorId,

            correlationId: `capital-receipt-verification-repeated-correlation-${fixtureId}`,

            requestedAt: new Date("2026-09-03T14:06:00.000Z"),

            idempotencyKey: `capital-receipt-verification-repeated-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      repeatedTransitionError = error;
    }

    assertErrorCode(
      repeatedTransitionError,
      "PROGRAM_CAPITAL_RECEIPT_TRANSITION_INVALID",
    );

    /*
     * Durable history.
     */
    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: receiptId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: receiptId,
      },
    });

    const reportedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,
      },
    });

    const verificationStartedEventCount =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,

          eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
        },
      });

    const failedRepeatedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        eventId: `capital-receipt-verification-repeated-event-${fixtureId}`,
      },
    });

    assert.equal(aggregateCount, 1);
    assert.equal(eventCount, 2);
    assert.equal(reportedEventCount, 1);
    assert.equal(verificationStartedEventCount, 1);
    assert.equal(failedRepeatedEventCount, 0);

    console.log(
      "✓ Durable Program Capital Receipt verification-start smoke test passed",
    );

    console.log({
      receipt: {
        id: loaded.aggregate.id,

        status: loaded.aggregate.status,

        version: loaded.aggregate.metadata.version,

        receiptMethod: loaded.aggregate.receiptMethod,

        declaredAmount: loaded.aggregate.declaredAmount,

        externalReference: loaded.aggregate.externalReference,
      },

      recognitionState: {
        verifiedAmount: loaded.aggregate.verifiedAmount,

        recognizedAmount: loaded.aggregate.recognizedAmount,

        verifiedAt: loaded.aggregate.verifiedAt,

        recognizedAt: loaded.aggregate.recognizedAt,
      },

      durableState: {
        aggregates: aggregateCount,

        events: eventCount,

        reportedEvents: reportedEventCount,

        verificationStartedEvents: verificationStartedEventCount,

        failedRepeatedEvents: failedRepeatedEventCount,
      },

      invariants: {
        canonicalReportedReceiptRequired: true,

        missingReceiptRejected: true,

        reportedReceiptCanEnterVerification: true,

        receiptAdvancesFromReportedToUnderVerification: true,

        receiptAdvancesFromVersionOneToTwo: true,

        declaredAmountRetained: true,

        externalTransactionIdentityRetained: true,

        durableReloadReconstructsVerificationState: true,

        reportingEventRemainsInHistory: true,

        exactlyOneVerificationStartedEventAppended: true,

        repeatedVerificationStartRejected: true,

        failedRepeatedTransitionAppendsNoEvent: true,

        beginningVerificationDoesNotVerifyCapital: true,

        beginningVerificationDoesNotRecognizeCapital: true,

        beginningVerificationDoesNotEstablishAvailability: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        OR: [
          {
            idempotencyKey: {
              contains: fixtureId,
            },
          },

          {
            correlationId: {
              contains: fixtureId,
            },
          },
        ],
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: {
          contains: fixtureId,
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
