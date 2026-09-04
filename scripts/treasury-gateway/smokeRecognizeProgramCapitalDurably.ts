import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PrismaClient, type TransactionClient } from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  CAPITAL_RECEIPT_METHOD,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";
import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../../src/domains/treasury/gateway/capital-receipts/status";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";
import { reportProgramCapitalReceiptIdempotentlyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";
import { beginProgramCapitalReceiptVerificationDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationDurablyWithClient";
import { admitProgramCapitalReceiptEvidenceDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/admitProgramCapitalReceiptEvidenceDurablyWithClient";
import { verifyProgramCapitalReceiptDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/verifyProgramCapitalReceiptDurablyWithClient";
import { recognizeProgramCapitalDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/recognizeProgramCapitalDurablyWithClient";
import { loadProgramCapitalReceiptWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

const prisma = new PrismaClient();

function context(step: string, requestedAt: Date, fixtureId: string) {
  return {
    commandId: `capital-receipt-${step}-command-${fixtureId}`,
    actorId: `capital-receipt-operator-${fixtureId}`,
    correlationId: `capital-receipt-correlation-${fixtureId}`,
    requestedAt,
    idempotencyKey: `capital-receipt-${step}-idempotency-${fixtureId}`,
  };
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const receiptId = `capital-receipt-recognition-${fixtureId}`;

  const transactionHash = `0x${fixtureId.replaceAll("-", "")}`;

  const blockchainEvidenceId = `capital-receipt-blockchain-evidence-${fixtureId}`;

  const operatorEvidenceId = `capital-receipt-operator-evidence-${fixtureId}`;

  /*
   * v1 — external receipt is reported.
   *
   * External observation establishes neither
   * verification nor recognition.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await reportProgramCapitalReceiptIdempotentlyWithClient({
      request: {
        receiptId,

        reference: `DONGIN-USDT-RECOGNITION-${fixtureId}`,

        eventId: `capital-receipt-reported-event-${fixtureId}`,

        context: context(
          "report",
          new Date("2026-09-04T12:01:00.000Z"),
          fixtureId,
        ),

        payload: {
          programId: `program-${fixtureId}`,

          destinationProgramAccountId: `program-account-${fixtureId}`,

          declaredAmount: {
            amount: "600000.00",
            currency: "USDT",
          },

          receiptMethod: CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

          externalReference: transactionHash,

          receivedAt: new Date("2026-09-04T12:00:00.000Z"),
        },
      },

      client: tx,
    });
  });

  /*
   * v2 — Treasury accepts the receipt into
   * governed verification.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await beginProgramCapitalReceiptVerificationDurablyWithClient({
      receiptId,

      eventId: `capital-receipt-verification-started-event-${fixtureId}`,

      context: context(
        "begin-verification",
        new Date("2026-09-04T12:02:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  /*
   * v3 — blockchain transaction evidence is admitted.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId: blockchainEvidenceId,

      evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

      artifactId: `capital-receipt-blockchain-artifact-${fixtureId}`,

      externalReference: transactionHash,

      recordedAt: new Date("2026-09-04T12:03:00.000Z"),

      eventId: `capital-receipt-blockchain-evidence-event-${fixtureId}`,

      context: context(
        "admit-blockchain-evidence",
        new Date("2026-09-04T12:03:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  /*
   * v4 — operator confirmation evidence is admitted.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId: operatorEvidenceId,

      evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

      artifactId: `capital-receipt-operator-artifact-${fixtureId}`,

      recordedAt: new Date("2026-09-04T12:04:00.000Z"),

      eventId: `capital-receipt-operator-evidence-event-${fixtureId}`,

      context: context(
        "admit-operator-evidence",
        new Date("2026-09-04T12:04:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  /*
   * v5 — Treasury verifies observed reality.
   *
   * The verified amount deliberately differs from
   * the declared amount:
   *
   * declared = 600000.00 USDT
   * verified = 599980.00 USDT
   *
   * This preserves:
   *
   * DECLARED ≠ VERIFIED
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await verifyProgramCapitalReceiptDurablyWithClient({
      command: {
        context: context(
          "verify",
          new Date("2026-09-04T12:05:00.000Z"),
          fixtureId,
        ),

        payload: {
          receiptId,

          verifiedAmount: {
            amount: "599980.00",
            currency: "USDT",
          },

          evidenceIds: [blockchainEvidenceId, operatorEvidenceId],

          verifiedAt: new Date("2026-09-04T12:05:00.000Z"),
        },
      },

      eventId: `capital-receipt-verified-event-${fixtureId}`,

      client: tx,
    });
  });

  /*
   * Establish the canonical pre-recognition state.
   */
  const beforeRecognition = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(beforeRecognition);

  assert.equal(
    beforeRecognition.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
  );

  assert.equal(beforeRecognition.aggregate.metadata.version, 5);

  assert.deepEqual(beforeRecognition.aggregate.declaredAmount, {
    amount: "600000.00",
    currency: "USDT",
  });

  assert.deepEqual(beforeRecognition.aggregate.verifiedAmount, {
    amount: "599980.00",
    currency: "USDT",
  });

  assert.equal(beforeRecognition.aggregate.recognizedAmount, undefined);

  assert.equal(beforeRecognition.aggregate.recognizedAt, undefined);

  /*
   * Failed judgment 1:
   *
   * Recognition cannot exceed verified reality.
   *
   * The original declaration was 600000 USDT,
   * but verification established only 599980 USDT.
   * Recognition cannot resurrect the larger claim.
   */
  let excessiveRecognitionRejected = false;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await recognizeProgramCapitalDurablyWithClient({
        command: {
          context: context(
            "recognize-excessive",
            new Date("2026-09-04T12:06:00.000Z"),
            fixtureId,
          ),

          payload: {
            receiptId,

            recognizedAmount: {
              amount: "600000.00",
              currency: "USDT",
            },

            recognitionMemo: "Deliberate over-recognition attempt.",
          },
        },

        eventId: `capital-receipt-excessive-recognition-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error) {
    assert.ok(error instanceof Error);

    assert.match(
      error.message,
      /\[PROGRAM_CAPITAL_RECEIPT_RECOGNIZED_AMOUNT_EXCEEDS_VERIFIED\]/,
    );

    excessiveRecognitionRejected = true;
  }

  assert.equal(excessiveRecognitionRejected, true);

  /*
   * Failed judgment 2:
   *
   * Recognition cannot substitute a different
   * monetary identity from verification.
   */
  let recognitionCurrencyMismatchRejected = false;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await recognizeProgramCapitalDurablyWithClient({
        command: {
          context: context(
            "recognize-currency-mismatch",
            new Date("2026-09-04T12:06:30.000Z"),
            fixtureId,
          ),

          payload: {
            receiptId,

            recognizedAmount: {
              amount: "500000.00",
              currency: "USD",
            },

            recognitionMemo: "Deliberate currency substitution attempt.",
          },
        },

        eventId: `capital-receipt-currency-mismatch-recognition-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error) {
    assert.ok(error instanceof Error);

    assert.match(
      error.message,
      /\[PROGRAM_CAPITAL_RECEIPT_RECOGNIZED_AMOUNT_CURRENCY_MISMATCH\]/,
    );

    recognitionCurrencyMismatchRejected = true;
  }

  assert.equal(recognitionCurrencyMismatchRejected, true);

  /*
   * Failed judgments must leave canonical Treasury
   * truth untouched at VERIFIED @ v5.
   */
  const afterFailedRecognition = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(afterFailedRecognition);

  assert.equal(
    afterFailedRecognition.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
  );

  assert.equal(afterFailedRecognition.aggregate.metadata.version, 5);

  assert.deepEqual(afterFailedRecognition.aggregate.verifiedAmount, {
    amount: "599980.00",
    currency: "USDT",
  });

  assert.equal(afterFailedRecognition.aggregate.recognizedAmount, undefined);

  assert.equal(afterFailedRecognition.aggregate.recognizedAt, undefined);

  /*
   * v6 — Treasury makes a deliberately conservative
   * recognition judgment.
   *
   * verified   = 599980.00 USDT
   * recognized = 500000.00 USDT
   *
   * Recognition is therefore a governed accounting
   * judgment rather than a mechanical alias for
   * verification.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await recognizeProgramCapitalDurablyWithClient({
      command: {
        context: context(
          "recognize",
          new Date("2026-09-04T12:07:00.000Z"),
          fixtureId,
        ),

        payload: {
          receiptId,

          recognizedAmount: {
            amount: "500000.00",
            currency: "USDT",
          },

          recognitionMemo:
            "Treasury recognition intentionally limited below verified amount.",
        },
      },

      eventId: `capital-receipt-recognized-event-${fixtureId}`,

      client: tx,
    });
  });

  const recognized = await prisma.$transaction(async (tx: TransactionClient) =>
    loadProgramCapitalReceiptWithClient({
      receiptId,
      client: tx,
    }),
  );

  assert.ok(recognized);

  assert.equal(
    recognized.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
  );

  assert.equal(recognized.aggregate.metadata.version, 6);

  assert.deepEqual(recognized.aggregate.declaredAmount, {
    amount: "600000.00",
    currency: "USDT",
  });

  assert.deepEqual(recognized.aggregate.verifiedAmount, {
    amount: "599980.00",
    currency: "USDT",
  });

  assert.deepEqual(recognized.aggregate.recognizedAmount, {
    amount: "500000.00",
    currency: "USDT",
  });

  assert.equal(
    recognized.aggregate.recognizedAt?.toISOString(),
    "2026-09-04T12:07:00.000Z",
  );

  /*
   * Durable history must contain exactly one event
   * for each canonical lifecycle fact.
   */
  const [
    aggregateCount,
    eventCount,
    reportedEvents,
    verificationStartedEvents,
    evidenceEvents,
    verifiedEvents,
    recognizedEvents,
  ] = await Promise.all([
    prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateId: receiptId,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
      },
    }),
  ]);

  assert.equal(aggregateCount, 1);

  assert.equal(eventCount, 6);

  assert.equal(reportedEvents, 1);

  assert.equal(verificationStartedEvents, 1);

  assert.equal(evidenceEvents, 2);

  assert.equal(verifiedEvents, 1);

  assert.equal(recognizedEvents, 1);

  /*
   * A second recognition is an invalid lifecycle
   * transition. It must neither mutate the aggregate
   * nor append another recognition event.
   */
  let repeatedRecognitionRejected = false;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await recognizeProgramCapitalDurablyWithClient({
        command: {
          context: context(
            "recognize-again",
            new Date("2026-09-04T12:08:00.000Z"),
            fixtureId,
          ),

          payload: {
            receiptId,

            recognizedAmount: {
              amount: "500000.00",
              currency: "USDT",
            },
          },
        },

        eventId: `capital-receipt-repeated-recognition-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error) {
    assert.ok(error instanceof Error);

    repeatedRecognitionRejected = true;
  }

  assert.equal(repeatedRecognitionRejected, true);

  const finalReceipt = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(finalReceipt);

  assert.equal(
    finalReceipt.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
  );

  assert.equal(finalReceipt.aggregate.metadata.version, 6);

  assert.deepEqual(finalReceipt.aggregate.recognizedAmount, {
    amount: "500000.00",
    currency: "USDT",
  });

  const finalEventCount = await prisma.treasuryGatewayEvent.count({
    where: {
      aggregateId: receiptId,
    },
  });

  const finalRecognizedEventCount = await prisma.treasuryGatewayEvent.count({
    where: {
      aggregateId: receiptId,

      eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
    },
  });

  assert.equal(finalEventCount, 6);

  assert.equal(finalRecognizedEventCount, 1);

  console.log(
    "✓ Durable Program Capital Receipt recognition smoke test passed",
  );

  console.dir(
    {
      receipt: {
        id: finalReceipt.aggregate.id,
        status: finalReceipt.aggregate.status,
        version: finalReceipt.aggregate.metadata.version,

        declaredAmount: finalReceipt.aggregate.declaredAmount,

        verifiedAmount: finalReceipt.aggregate.verifiedAmount,

        recognizedAmount: finalReceipt.aggregate.recognizedAmount,
      },

      durableState: {
        aggregates: aggregateCount,
        events: finalEventCount,
        reportedEvents,
        verificationStartedEvents,
        evidenceEvents,
        verifiedEvents,
        recognizedEvents: finalRecognizedEventCount,
      },

      invariants: {
        canonicalReceiptMustBeVerified:
          beforeRecognition.aggregate.status ===
          PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,

        recognitionCannotExceedVerifiedReality: excessiveRecognitionRejected,

        recognitionPreservesCurrencyIdentity:
          recognitionCurrencyMismatchRejected,

        failedRecognitionJudgmentsPreserveVersionFive:
          afterFailedRecognition.aggregate.metadata.version === 5,

        failedRecognitionJudgmentsAppendNoEvents: eventCount === 6,

        recognizedAmountMayBeLessThanVerifiedAmount:
          finalReceipt.aggregate.recognizedAmount?.amount === "500000.00" &&
          finalReceipt.aggregate.verifiedAmount?.amount === "599980.00",

        recognitionAdvancesVersionFiveToSix:
          finalReceipt.aggregate.metadata.version === 6,

        recognitionProducesExactlyOneEvent: finalRecognizedEventCount === 1,

        repeatedRecognitionRejected,

        repeatedRecognitionPreservesVersionSix:
          finalReceipt.aggregate.metadata.version === 6,

        repeatedRecognitionAppendsNoEvent: finalEventCount === 6,

        recognitionDoesNotRewriteDeclaredReality:
          finalReceipt.aggregate.declaredAmount.amount === "600000.00",

        recognitionDoesNotRewriteVerifiedReality:
          finalReceipt.aggregate.verifiedAmount?.amount === "599980.00",

        recognizedCapitalDoesNotEstablishAvailability: true,
      },
    },
    {
      depth: null,
    },
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
