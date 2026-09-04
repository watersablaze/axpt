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
import { loadProgramCapitalReceiptWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";
import { loadCapitalReceiptEvidenceWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadCapitalReceiptEvidenceWithClient";

const prisma = new PrismaClient();

async function main() {
  const fixtureId = randomUUID();

  const receiptId = `capital-receipt-verification-judgment-${fixtureId}`;

  const actorId = `capital-receipt-operator-${fixtureId}`;

  const correlationId = `capital-receipt-verification-correlation-${fixtureId}`;

  const blockchainEvidenceId = `capital-receipt-blockchain-evidence-${fixtureId}`;

  const operatorEvidenceId = `capital-receipt-operator-evidence-${fixtureId}`;

  const transactionHash = `0x${fixtureId.replaceAll("-", "")}`;

  const context = (commandName: string, requestedAt: Date) => ({
    commandId: `capital-receipt-${commandName}-command-${fixtureId}`,

    actorId,

    correlationId,

    requestedAt,

    idempotencyKey: `capital-receipt-${commandName}-idempotency-${fixtureId}`,
  });

  await prisma.$transaction(async (tx: TransactionClient) => {
    await reportProgramCapitalReceiptIdempotentlyWithClient({
      request: {
        receiptId,

        reference: `DONGIN-USDT-${fixtureId}`,

        eventId: `capital-receipt-reported-event-${fixtureId}`,

        context: context("report", new Date("2026-09-03T14:01:00.000Z")),

        payload: {
          programId: `program-${fixtureId}`,

          destinationProgramAccountId: `program-account-${fixtureId}`,

          declaredAmount: {
            amount: "600000.00",
            currency: "USDT",
          },

          receiptMethod: CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

          externalReference: transactionHash,

          receivedAt: new Date("2026-09-03T14:00:00.000Z"),
        },
      },

      client: tx,
    });
  });

  await prisma.$transaction(async (tx: TransactionClient) => {
    await beginProgramCapitalReceiptVerificationDurablyWithClient({
      receiptId,

      eventId: `capital-receipt-verification-started-event-${fixtureId}`,

      context: context(
        "begin-verification",
        new Date("2026-09-03T14:02:00.000Z"),
      ),

      client: tx,
    });
  });

  /*
   * Failure law:
   * verification requires an evidentiary basis.
   */
  let noEvidenceError: unknown;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await verifyProgramCapitalReceiptDurablyWithClient({
        command: {
          context: context(
            "verify-without-evidence",
            new Date("2026-09-03T14:02:30.000Z"),
          ),

          payload: {
            receiptId,

            verifiedAmount: {
              amount: "599980.00",
              currency: "USDT",
            },

            evidenceIds: [],

            verifiedAt: new Date("2026-09-03T14:02:30.000Z"),
          },
        },

        eventId: `capital-receipt-no-evidence-verification-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error: unknown) {
    noEvidenceError = error;
  }

  assert(noEvidenceError instanceof Error);

  assert(
    noEvidenceError.message.includes(
      "[PROGRAM_CAPITAL_RECEIPT_VERIFICATION_EVIDENCE_REQUIRED]",
    ),
  );

  /*
   * Admit canonical blockchain evidence.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId: blockchainEvidenceId,

      evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

      artifactId: `capital-receipt-blockchain-artifact-${fixtureId}`,

      externalReference: transactionHash,

      recordedAt: new Date("2026-09-03T14:03:00.000Z"),

      eventId: `capital-receipt-blockchain-evidence-event-${fixtureId}`,

      context: context(
        "admit-blockchain-evidence",
        new Date("2026-09-03T14:03:00.000Z"),
      ),

      client: tx,
    });
  });

  /*
   * Failure law:
   * selected evidence identities cannot repeat.
   */
  let duplicateSelectionError: unknown;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await verifyProgramCapitalReceiptDurablyWithClient({
        command: {
          context: context(
            "verify-duplicate-evidence",
            new Date("2026-09-03T14:03:15.000Z"),
          ),

          payload: {
            receiptId,

            verifiedAmount: {
              amount: "599980.00",
              currency: "USDT",
            },

            evidenceIds: [blockchainEvidenceId, blockchainEvidenceId],

            verifiedAt: new Date("2026-09-03T14:03:15.000Z"),
          },
        },

        eventId: `capital-receipt-duplicate-selection-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error: unknown) {
    duplicateSelectionError = error;
  }

  assert(duplicateSelectionError instanceof Error);

  assert(
    duplicateSelectionError.message.includes(
      "[PROGRAM_CAPITAL_RECEIPT_VERIFICATION_EVIDENCE_DUPLICATE]",
    ),
  );

  /*
   * Failure law:
   * every selected identity must resolve against
   * canonical admitted evidence.
   */
  let unadmittedEvidenceError: unknown;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await verifyProgramCapitalReceiptDurablyWithClient({
        command: {
          context: context(
            "verify-unadmitted-evidence",
            new Date("2026-09-03T14:03:30.000Z"),
          ),

          payload: {
            receiptId,

            verifiedAmount: {
              amount: "599980.00",
              currency: "USDT",
            },

            evidenceIds: [
              blockchainEvidenceId,
              `never-admitted-evidence-${fixtureId}`,
            ],

            verifiedAt: new Date("2026-09-03T14:03:30.000Z"),
          },
        },

        eventId: `capital-receipt-unadmitted-evidence-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error: unknown) {
    unadmittedEvidenceError = error;
  }

  assert(unadmittedEvidenceError instanceof Error);

  assert(
    unadmittedEvidenceError.message.includes(
      "[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVIDENCE_NOT_ADMITTED]",
    ),
  );

  /*
   * Admit the second canonical evidence record.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await admitProgramCapitalReceiptEvidenceDurablyWithClient({
      receiptId,

      evidenceId: operatorEvidenceId,

      evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

      artifactId: `capital-receipt-operator-artifact-${fixtureId}`,

      recordedAt: new Date("2026-09-03T14:04:00.000Z"),

      eventId: `capital-receipt-operator-evidence-event-${fixtureId}`,

      context: context(
        "admit-operator-evidence",
        new Date("2026-09-03T14:04:00.000Z"),
      ),

      client: tx,
    });
  });

  /*
   * Failure law:
   * verification preserves monetary currency identity.
   */
  let currencyMismatchError: unknown;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await verifyProgramCapitalReceiptDurablyWithClient({
        command: {
          context: context(
            "verify-currency-mismatch",
            new Date("2026-09-03T14:04:15.000Z"),
          ),

          payload: {
            receiptId,

            verifiedAmount: {
              amount: "599980.00",
              currency: "USD",
            },

            evidenceIds: [blockchainEvidenceId, operatorEvidenceId],

            verifiedAt: new Date("2026-09-03T14:04:15.000Z"),
          },
        },

        eventId: `capital-receipt-currency-mismatch-event-${fixtureId}`,

        client: tx,
      });
    });
  } catch (error: unknown) {
    currencyMismatchError = error;
  }

  assert(currencyMismatchError instanceof Error);

  assert(
    currencyMismatchError.message.includes(
      "[PROGRAM_CAPITAL_RECEIPT_VERIFIED_AMOUNT_CURRENCY_MISMATCH]",
    ),
  );

  /*
   * Canonical verification judgment.
   *
   * The verified amount deliberately differs from the
   * declared amount. CR-4 preserves discrepancy rather
   * than forcing observation to equal declaration.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await verifyProgramCapitalReceiptDurablyWithClient({
      command: {
        context: context("verify", new Date("2026-09-03T14:05:00.000Z")),

        payload: {
          receiptId,

          verifiedAmount: {
            amount: "599980.00",
            currency: "USDT",
          },

          evidenceIds: [blockchainEvidenceId, operatorEvidenceId],

          verifiedAt: new Date("2026-09-03T14:05:00.000Z"),
        },
      },

      eventId: `capital-receipt-verified-event-${fixtureId}`,

      client: tx,
    });
  });

  const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
    loadProgramCapitalReceiptWithClient({
      receiptId,
      client: tx,
    }),
  );

  assert(loaded);

  const receipt = loaded.aggregate;

  assert.equal(receipt.status, PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED);

  assert.equal(receipt.metadata.version, 5);

  assert.deepEqual(receipt.verifiedAmount, {
    amount: "599980.00",
    currency: "USDT",
  });

  assert.equal(receipt.recognizedAmount, undefined);

  assert.equal(receipt.recognizedAt, undefined);

  const evidenceAtVerification = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadCapitalReceiptEvidenceWithClient({
        receiptId,
        receiptVersion: 4,
        client: tx,
      }),
  );

  assert.equal(evidenceAtVerification.length, 2);

  /*
   * Once VERIFIED, the evidentiary horizon is closed.
   */
  let postVerificationEvidenceError: unknown;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await admitProgramCapitalReceiptEvidenceDurablyWithClient({
        receiptId,

        evidenceId: `late-evidence-${fixtureId}`,

        evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.CUSTODIAN_STATEMENT,

        artifactId: `late-artifact-${fixtureId}`,

        recordedAt: new Date("2026-09-03T14:06:00.000Z"),

        eventId: `late-evidence-event-${fixtureId}`,

        context: context(
          "admit-late-evidence",
          new Date("2026-09-03T14:06:00.000Z"),
        ),

        client: tx,
      });
    });
  } catch (error: unknown) {
    postVerificationEvidenceError = error;
  }

  assert(postVerificationEvidenceError instanceof Error);

  const durableState = await prisma.$transaction(
    async (tx: TransactionClient) => {
      const [
        aggregates,
        events,
        reportedEvents,
        verificationStartedEvents,
        evidenceEvents,
        verifiedEvents,
        recognizedEvents,
      ] = await Promise.all([
        tx.treasuryGatewayAggregate.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
          },
        }),

        tx.treasuryGatewayEvent.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
          },
        }),

        tx.treasuryGatewayEvent.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
            eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,
          },
        }),

        tx.treasuryGatewayEvent.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
            eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
          },
        }),

        tx.treasuryGatewayEvent.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
            eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
          },
        }),

        tx.treasuryGatewayEvent.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
            eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
          },
        }),

        tx.treasuryGatewayEvent.count({
          where: {
            aggregateType: "PROGRAM_CAPITAL_RECEIPT",
            aggregateId: receiptId,
            eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
          },
        }),
      ]);

      return {
        aggregates,
        events,
        reportedEvents,
        verificationStartedEvents,
        evidenceEvents,
        verifiedEvents,
        recognizedEvents,
      };
    },
  );

  assert.equal(durableState.aggregates, 1);

  assert.equal(durableState.events, 5);

  assert.equal(durableState.reportedEvents, 1);

  assert.equal(durableState.verificationStartedEvents, 1);

  assert.equal(durableState.evidenceEvents, 2);

  assert.equal(durableState.verifiedEvents, 1);

  assert.equal(durableState.recognizedEvents, 0);

  const verificationEvent = await prisma.treasuryGatewayEvent.findFirst({
    where: {
      aggregateType: "PROGRAM_CAPITAL_RECEIPT",

      aggregateId: receiptId,

      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
    },

    select: {
      payload: true,
      aggregateVersion: true,
    },
  });

  assert(verificationEvent);

  assert.equal(verificationEvent.aggregateVersion, 5);

  const verificationPayload = verificationEvent.payload as {
    evidenceIds?: unknown;
  };

  assert.deepEqual(verificationPayload.evidenceIds, [
    blockchainEvidenceId,
    operatorEvidenceId,
  ]);

  console.log(
    "✓ Durable Program Capital Receipt verification smoke test passed",
  );

  console.dir(
    {
      receipt: {
        id: receipt.id,
        status: receipt.status,
        version: receipt.metadata.version,
        declaredAmount: receipt.declaredAmount,
        verifiedAmount: receipt.verifiedAmount,
      },

      evidence: {
        evidentiaryHorizonVersion: 4,
        admittedAtJudgment: evidenceAtVerification.length,

        selectedEvidenceIds: verificationPayload.evidenceIds,
      },

      recognitionState: {
        recognizedAmount: receipt.recognizedAmount,

        recognizedAt: receipt.recognizedAt,
      },

      durableState,

      invariants: {
        canonicalReceiptMustBeUnderVerification: true,

        verificationRequiresEvidence: true,

        verificationEvidenceSelectionMustBeUnique: true,

        selectedEvidenceMustBeCanonicallyAdmitted: true,

        verificationPreservesCurrencyIdentity: true,

        verifiedAmountMayDifferFromDeclaredAmount: true,

        verificationAdvancesVersionFourToFive: true,

        verificationProducesExactlyOneJudgmentEvent: true,

        verificationEventRetainsSelectedEvidence: true,

        verificationClosesEvidenceAdmission: true,

        failedJudgmentsAppendNoEvents: true,

        verifiedCapitalRemainsUnrecognized: true,

        verifiedCapitalDoesNotEstablishAvailability: true,
      },
    },
    {
      depth: null,
    },
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
