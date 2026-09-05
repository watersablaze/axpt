import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PrismaClient, type TransactionClient } from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  CAPITAL_RECEIPT_METHOD,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";
import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../../src/domains/treasury/gateway/capital-receipts/status";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";
import { compareDecimals } from "../../src/domains/treasury/gateway/shared/decimalAmount";

import { reportProgramCapitalReceiptIdempotentlyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";
import { beginProgramCapitalReceiptVerificationDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationDurablyWithClient";
import { admitProgramCapitalReceiptEvidenceDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/admitProgramCapitalReceiptEvidenceDurablyWithClient";
import { verifyProgramCapitalReceiptDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/verifyProgramCapitalReceiptDurablyWithClient";
import { recognizeProgramCapitalDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/recognizeProgramCapitalDurablyWithClient";
import { reverseRecognizedProgramCapitalDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reverseRecognizedProgramCapitalDurablyWithClient";
import { getRecognizedCapitalPositionWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/getRecognizedCapitalPositionWithClient";
import { loadProgramCapitalReceiptWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

const prisma = new PrismaClient();

function context(step: string, requestedAt: Date, fixtureId: string) {
  return {
    commandId: `capital-reversal-${step}-command-${fixtureId}`,
    actorId: `capital-reversal-operator-${fixtureId}`,
    correlationId: `capital-reversal-correlation-${fixtureId}`,
    requestedAt,
    idempotencyKey: `capital-reversal-${step}-idempotency-${fixtureId}`,
  };
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const receiptId = `capital-receipt-reversal-${fixtureId}`;
  const programAccountId = `program-account-reversal-${fixtureId}`;
  const transactionHash = `0x${fixtureId.replaceAll("-", "")}`;

  const blockchainEvidenceId =
    `capital-reversal-blockchain-evidence-${fixtureId}`;

  const operatorEvidenceId =
    `capital-reversal-operator-evidence-${fixtureId}`;

  /*
   * v1 — external receipt reported.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await reportProgramCapitalReceiptIdempotentlyWithClient({
      request: {
        receiptId,

        reference: `DONGIN-USDT-REVERSAL-${fixtureId}`,

        eventId: `capital-reversal-reported-event-${fixtureId}`,

        context: context(
          "report",
          new Date("2026-09-05T10:01:00.000Z"),
          fixtureId,
        ),

        payload: {
          programId: `program-${fixtureId}`,

          destinationProgramAccountId: programAccountId,

          declaredAmount: {
            amount: "600000.00",
            currency: "USDT",
          },

          receiptMethod: CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

          externalReference: transactionHash,

          receivedAt: new Date("2026-09-05T10:00:00.000Z"),
        },
      },

      client: tx,
    });
  });

  /*
   * v2 — governed verification begins.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await beginProgramCapitalReceiptVerificationDurablyWithClient({
      receiptId,

      eventId: `capital-reversal-verification-started-event-${fixtureId}`,

      context: context(
        "begin-verification",
        new Date("2026-09-05T10:02:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  /*
   * v3 — blockchain evidence admitted.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId: blockchainEvidenceId,

      evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

      artifactId: `capital-reversal-blockchain-artifact-${fixtureId}`,

      externalReference: transactionHash,

      recordedAt: new Date("2026-09-05T10:03:00.000Z"),

      eventId: `capital-reversal-blockchain-evidence-event-${fixtureId}`,

      context: context(
        "admit-blockchain-evidence",
        new Date("2026-09-05T10:03:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  /*
   * v4 — operator evidence admitted.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId: operatorEvidenceId,

      evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

      artifactId: `capital-reversal-operator-artifact-${fixtureId}`,

      recordedAt: new Date("2026-09-05T10:04:00.000Z"),

      eventId: `capital-reversal-operator-evidence-event-${fixtureId}`,

      context: context(
        "admit-operator-evidence",
        new Date("2026-09-05T10:04:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  /*
   * v5 — observed reality verified.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await verifyProgramCapitalReceiptDurablyWithClient({
      command: {
        context: context(
          "verify",
          new Date("2026-09-05T10:05:00.000Z"),
          fixtureId,
        ),

        payload: {
          receiptId,

          verifiedAmount: {
            amount: "599980.00",
            currency: "USDT",
          },

          evidenceIds: [blockchainEvidenceId, operatorEvidenceId],

          verifiedAt: new Date("2026-09-05T10:05:00.000Z"),
        },
      },

      eventId: `capital-reversal-verified-event-${fixtureId}`,

      client: tx,
    });
  });

  /*
   * v6 — Treasury recognizes 500000 USDT.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await recognizeProgramCapitalDurablyWithClient({
      command: {
        context: context(
          "recognize",
          new Date("2026-09-05T10:06:00.000Z"),
          fixtureId,
        ),

        payload: {
          receiptId,

          recognizedAmount: {
            amount: "500000.00",
            currency: "USDT",
          },

          recognitionMemo:
            "Recognition established before governed reversal smoke.",
        },
      },

      eventId: `capital-reversal-recognized-event-${fixtureId}`,

      client: tx,
    });
  });

  const recognized = await prisma.$transaction(
    async (tx: TransactionClient) =>
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

  assert.deepEqual(recognized.aggregate.recognizedAmount, {
    amount: "500000.00",
    currency: "USDT",
  });

  assert.equal(
    recognized.aggregate.recognizedAt?.toISOString(),
    "2026-09-05T10:06:00.000Z",
  );

  const recognizedAtBeforeReversal =
    recognized.aggregate.recognizedAt?.toISOString();

  const positionBeforeReversal =
    await getRecognizedCapitalPositionWithClient({
      programAccountId,
      currency: "USDT",
      client: prisma,
    });

  assert.equal(
    compareDecimals(
      positionBeforeReversal.recognizedAmount.amount,
      "500000.00",
    ),
    0,
  );

  assert.deepEqual(positionBeforeReversal.contributingReceiptIds, [
    receiptId,
  ]);

  const eventCountBeforeFailedReversal =
    await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,
      },
    });

  assert.equal(eventCountBeforeFailedReversal, 6);

  /*
   * Failed judgment:
   *
   * Treasury may not remove the current financial
   * effect of recognition without recording why.
   */
  let blankReasonRejected = false;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await reverseRecognizedProgramCapitalDurablyWithClient({
        command: {
          context: context(
            "reverse-blank-reason",
            new Date("2026-09-05T10:07:00.000Z"),
            fixtureId,
          ),

          payload: {
            receiptId,
            reason: "   ",
          },
        },

        eventId: `capital-reversal-blank-reason-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error) {
    assert.ok(error instanceof Error);

    assert.match(
      error.message,
      /\[PROGRAM_CAPITAL_RECEIPT_RECOGNITION_REVERSAL_REASON_REQUIRED\]/,
    );

    blankReasonRejected = true;
  }

  assert.equal(blankReasonRejected, true);

  const afterBlankReason = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(afterBlankReason);

  assert.equal(
    afterBlankReason.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
  );

  assert.equal(afterBlankReason.aggregate.metadata.version, 6);

  const eventCountAfterFailedReversal =
    await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,
      },
    });

  assert.equal(eventCountAfterFailedReversal, 6);

  /*
   * v7 — governed recognition reversal.
   *
   * The recognition's present financial effect is
   * removed. Its historical amount and timestamp
   * remain part of canonical Treasury history.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await reverseRecognizedProgramCapitalDurablyWithClient({
      command: {
        context: context(
          "reverse",
          new Date("2026-09-05T10:08:00.000Z"),
          fixtureId,
        ),

        payload: {
          receiptId,

          reason:
            "Recognition reversed by governed Treasury judgment for smoke verification.",
        },
      },

      eventId: `capital-reversal-reversed-event-${fixtureId}`,

      client: tx,
    });
  });

  const reversed = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(reversed);

  assert.equal(
    reversed.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED,
  );

  assert.equal(reversed.aggregate.metadata.version, 7);

  /*
   * Reversal does not erase the financial fact that
   * Treasury previously recognized.
   */
  assert.deepEqual(reversed.aggregate.recognizedAmount, {
    amount: "500000.00",
    currency: "USDT",
  });

  assert.equal(
    reversed.aggregate.recognizedAt?.toISOString(),
    recognizedAtBeforeReversal,
  );

  assert.deepEqual(reversed.aggregate.declaredAmount, {
    amount: "600000.00",
    currency: "USDT",
  });

  assert.deepEqual(reversed.aggregate.verifiedAmount, {
    amount: "599980.00",
    currency: "USDT",
  });

  /*
   * But the reversed recognition no longer contributes
   * to current recognized capital position.
   */
  const positionAfterReversal =
    await getRecognizedCapitalPositionWithClient({
      programAccountId,
      currency: "USDT",
      client: prisma,
    });

  assert.equal(
    compareDecimals(
      positionAfterReversal.recognizedAmount.amount,
      "0",
    ),
    0,
  );

  assert.equal(positionAfterReversal.contributingReceiptIds.length, 0);

  const [
    eventCountAfterReversal,
    recognitionEventCount,
    reversalEventCount,
  ] = await Promise.all([
    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
      },
    }),

    prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType:
          TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNITION_REVERSED,
      },
    }),
  ]);

  assert.equal(eventCountAfterReversal, 7);
  assert.equal(recognitionEventCount, 1);
  assert.equal(reversalEventCount, 1);

  /*
   * A reversal is itself a governed lifecycle fact.
   * It cannot be applied repeatedly to manufacture
   * further negative financial effect.
   */
  let repeatedReversalRejected = false;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await reverseRecognizedProgramCapitalDurablyWithClient({
        command: {
          context: context(
            "reverse-again",
            new Date("2026-09-05T10:09:00.000Z"),
            fixtureId,
          ),

          payload: {
            receiptId,

            reason: "Deliberate repeated reversal attempt.",
          },
        },

        eventId: `capital-reversal-repeated-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error) {
    assert.ok(error instanceof Error);

    assert.match(
      error.message,
      /\[PROGRAM_CAPITAL_RECEIPT_TRANSITION_INVALID\] REVERSED -> REVERSED/,
    );

    repeatedReversalRejected = true;
  }

  assert.equal(repeatedReversalRejected, true);

  const finalReceipt = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(finalReceipt);

  const finalEventCount = await prisma.treasuryGatewayEvent.count({
    where: {
      aggregateId: receiptId,
    },
  });

  const finalReversalEventCount =
    await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateId: receiptId,

        eventType:
          TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNITION_REVERSED,
      },
    });

  assert.equal(
    finalReceipt.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED,
  );

  assert.equal(finalReceipt.aggregate.metadata.version, 7);
  assert.equal(finalEventCount, 7);
  assert.equal(finalReversalEventCount, 1);

  assert.deepEqual(finalReceipt.aggregate.recognizedAmount, {
    amount: "500000.00",
    currency: "USDT",
  });

  assert.equal(
    finalReceipt.aggregate.recognizedAt?.toISOString(),
    recognizedAtBeforeReversal,
  );

  console.log(
    "✓ Durable Program Capital recognition reversal smoke test passed",
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
        recognizedAt: finalReceipt.aggregate.recognizedAt,
      },

      position: {
        beforeReversal: positionBeforeReversal,
        afterReversal: positionAfterReversal,
      },

      durableState: {
        events: finalEventCount,
        recognitionEvents: recognitionEventCount,
        reversalEvents: finalReversalEventCount,
      },

      invariants: {
        recognizedReceiptContributesBeforeReversal:
          compareDecimals(
            positionBeforeReversal.recognizedAmount.amount,
            "500000.00",
          ) === 0,

        blankReasonRejected,

        failedReversalPreservesVersionSix:
          afterBlankReason.aggregate.metadata.version === 6,

        failedReversalAppendsNoEvent:
          eventCountAfterFailedReversal === 6,

        reversalAdvancesVersionSixToSeven:
          finalReceipt.aggregate.metadata.version === 7,

        reversalPreservesRecognizedAmount:
          compareDecimals(
            finalReceipt.aggregate.recognizedAmount?.amount ?? "0",
            "500000.00",
          ) === 0,

        reversalPreservesRecognizedAt:
          finalReceipt.aggregate.recognizedAt?.toISOString() ===
          recognizedAtBeforeReversal,

        reversalPreservesDeclaredReality:
          finalReceipt.aggregate.declaredAmount.amount === "600000.00",

        reversalPreservesVerifiedReality:
          finalReceipt.aggregate.verifiedAmount?.amount === "599980.00",

        reversedRecognitionNoLongerContributesToPosition:
          compareDecimals(
            positionAfterReversal.recognizedAmount.amount,
            "0",
          ) === 0 &&
          positionAfterReversal.contributingReceiptIds.length === 0,

        recognitionHistoryPreserved:
          recognitionEventCount === 1,

        reversalProducesExactlyOneEvent:
          finalReversalEventCount === 1,

        repeatedReversalRejected,

        repeatedReversalPreservesVersionSeven:
          finalReceipt.aggregate.metadata.version === 7,

        repeatedReversalAppendsNoEvent:
          finalEventCount === 7,
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
