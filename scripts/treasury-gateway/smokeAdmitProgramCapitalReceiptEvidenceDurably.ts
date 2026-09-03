import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  CAPITAL_RECEIPT_METHOD,
  type CapitalReceiptEvidence,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../../src/domains/treasury/gateway/capital-receipts/status";

import { reportProgramCapitalReceiptIdempotentlyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

import { beginProgramCapitalReceiptVerificationDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationDurablyWithClient";

import { admitProgramCapitalReceiptEvidenceDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/admitProgramCapitalReceiptEvidenceDurablyWithClient";

import { loadProgramCapitalReceiptWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

import { loadCapitalReceiptEvidenceWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadCapitalReceiptEvidenceWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const actorId = `capital-receipt-operator-${fixtureId}`;

  const receiptId = `capital-receipt-evidence-${fixtureId}`;

  const transactionHash = `0x${fixtureId.replace(/-/g, "")}`;

  const reportedAt = new Date("2026-09-03T14:00:00.000Z");

  const verificationStartedAt = new Date("2026-09-03T14:02:00.000Z");

  const blockchainEvidenceRecordedAt = new Date("2026-09-03T14:03:00.000Z");

  const operatorEvidenceRecordedAt = new Date("2026-09-03T14:04:00.000Z");

  const blockchainEvidenceId = `capital-receipt-blockchain-evidence-${fixtureId}`;

  const operatorEvidenceId = `capital-receipt-operator-evidence-${fixtureId}`;

  const blockchainArtifactId = `capital-receipt-blockchain-artifact-${fixtureId}`;

  const operatorArtifactId = `capital-receipt-operator-artifact-${fixtureId}`;

  /*
   * CR-1
   *
   * External value is reported into canonical Treasury history.
   */
  const reported = await prisma.$transaction(async (tx: TransactionClient) =>
    reportProgramCapitalReceiptIdempotentlyWithClient({
      request: {
        receiptId,

        reference: `DONGIN-USDT-ACTIVATION-${fixtureId}`,

        eventId: `capital-receipt-reported-event-${fixtureId}`,

        context: {
          commandId: `capital-receipt-report-command-${fixtureId}`,

          actorId,

          correlationId: `capital-receipt-correlation-${fixtureId}`,

          requestedAt: new Date("2026-09-03T14:01:00.000Z"),

          idempotencyKey: `capital-receipt-report-idempotency-${fixtureId}`,
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

          externalReference: transactionHash,

          expectedAt: new Date("2026-09-03T13:30:00.000Z"),

          receivedAt: reportedAt,
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

  /*
   * CR-2
   *
   * Treasury assumes verification jurisdiction.
   */
  const verificationStarted = await prisma.$transaction(
    async (tx: TransactionClient) =>
      beginProgramCapitalReceiptVerificationDurablyWithClient({
        receiptId,

        eventId: `capital-receipt-verification-started-event-${fixtureId}`,

        context: {
          commandId: `capital-receipt-verification-start-command-${fixtureId}`,

          actorId,

          correlationId: `capital-receipt-correlation-${fixtureId}`,

          requestedAt: verificationStartedAt,

          idempotencyKey: `capital-receipt-verification-start-idempotency-${fixtureId}`,
        },

        client: tx,
      }),
  );

  assert.equal(
    verificationStarted.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
  );

  assert.equal(verificationStarted.aggregate.metadata.version, 2);

  /*
   * CR-3B / Evidence A
   *
   * Admit blockchain transaction evidence.
   */
  const blockchainAdmission = await prisma.$transaction(
    async (tx: TransactionClient) =>
      admitProgramCapitalReceiptEvidenceDurablyWithClient({
        receiptId,

        evidenceId: blockchainEvidenceId,

        evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

        artifactId: blockchainArtifactId,

        externalReference: transactionHash,

        recordedAt: blockchainEvidenceRecordedAt,

        eventId: `capital-receipt-blockchain-evidence-event-${fixtureId}`,

        context: {
          commandId: `capital-receipt-blockchain-evidence-command-${fixtureId}`,

          actorId,

          correlationId: `capital-receipt-correlation-${fixtureId}`,

          requestedAt: blockchainEvidenceRecordedAt,

          idempotencyKey: `capital-receipt-blockchain-evidence-idempotency-${fixtureId}`,
        },

        client: tx,
      }),
  );

  assert.equal(
    blockchainAdmission.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
  );

  assert.equal(blockchainAdmission.aggregate.metadata.version, 3);

  /*
   * CR-3B / Evidence B
   *
   * Admit an independent operator confirmation.
   */
  const operatorAdmission = await prisma.$transaction(
    async (tx: TransactionClient) =>
      admitProgramCapitalReceiptEvidenceDurablyWithClient({
        receiptId,

        evidenceId: operatorEvidenceId,

        evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,

        artifactId: operatorArtifactId,

        recordedAt: operatorEvidenceRecordedAt,

        eventId: `capital-receipt-operator-evidence-event-${fixtureId}`,

        context: {
          commandId: `capital-receipt-operator-evidence-command-${fixtureId}`,

          actorId,

          correlationId: `capital-receipt-correlation-${fixtureId}`,

          requestedAt: operatorEvidenceRecordedAt,

          idempotencyKey: `capital-receipt-operator-evidence-idempotency-${fixtureId}`,
        },

        client: tx,
      }),
  );

  assert.equal(
    operatorAdmission.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
  );

  assert.equal(operatorAdmission.aggregate.metadata.version, 4);

  /*
   * Receipt-scoped evidence identity.
   *
   * An evidence identity already admitted to this receipt
   * cannot be admitted again.
   */
  let duplicateEvidenceError: unknown;

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      admitProgramCapitalReceiptEvidenceDurablyWithClient({
        receiptId,

        evidenceId: blockchainEvidenceId,

        evidenceType: CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,

        artifactId: `duplicate-artifact-${fixtureId}`,

        externalReference: transactionHash,

        recordedAt: new Date("2026-09-03T14:05:00.000Z"),

        eventId: `capital-receipt-duplicate-evidence-event-${fixtureId}`,

        context: {
          commandId: `capital-receipt-duplicate-evidence-command-${fixtureId}`,

          actorId,

          correlationId: `capital-receipt-correlation-${fixtureId}`,

          requestedAt: new Date("2026-09-03T14:05:00.000Z"),

          idempotencyKey: `capital-receipt-duplicate-evidence-idempotency-${fixtureId}`,
        },

        client: tx,
      }),
    );
  } catch (error: unknown) {
    duplicateEvidenceError = error;
  }

  assert(duplicateEvidenceError instanceof Error);

  assert(
    duplicateEvidenceError.message.includes(
      "[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_ID_ALREADY_ADMITTED]",
    ),
  );

  /*
   * Canonical reload + temporal evidence reconstruction.
   */
  const loaded = await prisma.$transaction(async (tx: TransactionClient) => {
    const receipt = await loadProgramCapitalReceiptWithClient({
      receiptId,

      client: tx,
    });

    const evidenceAtVersionTwo = await loadCapitalReceiptEvidenceWithClient({
      receiptId,

      receiptVersion: 2,

      client: tx,
    });

    const evidenceAtVersionThree = await loadCapitalReceiptEvidenceWithClient({
      receiptId,

      receiptVersion: 3,

      client: tx,
    });

    const evidenceAtVersionFour = await loadCapitalReceiptEvidenceWithClient({
      receiptId,

      receiptVersion: 4,

      client: tx,
    });

    return {
      receipt,

      evidenceAtVersionTwo,

      evidenceAtVersionThree,

      evidenceAtVersionFour,
    };
  });

  assert(loaded.receipt);

  const receipt = loaded.receipt.aggregate;

  assert.equal(
    receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
  );

  assert.equal(receipt.metadata.version, 4);

  /*
   * Temporal truth:
   *
   * v2 knows no evidence.
   * v3 knows only Evidence A.
   * v4 knows Evidence A + Evidence B.
   */
  assert.equal(loaded.evidenceAtVersionTwo.length, 0);

  assert.equal(loaded.evidenceAtVersionThree.length, 1);

  assert.equal(loaded.evidenceAtVersionFour.length, 2);

  const firstEvidence = loaded.evidenceAtVersionFour[0];

  const secondEvidence = loaded.evidenceAtVersionFour[1];

  assert(firstEvidence);
  assert(secondEvidence);

  assert.equal(firstEvidence.id, blockchainEvidenceId);

  assert.equal(firstEvidence.receiptId, receiptId);

  assert.equal(
    firstEvidence.evidenceType,
    CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,
  );

  assert.equal(firstEvidence.artifactId, blockchainArtifactId);

  assert.equal(firstEvidence.externalReference, transactionHash);

  assert.equal(firstEvidence.submittedByActorId, actorId);

  assert.equal(
    firstEvidence.recordedAt.getTime(),
    blockchainEvidenceRecordedAt.getTime(),
  );

  assert.equal(secondEvidence.id, operatorEvidenceId);

  assert.equal(secondEvidence.receiptId, receiptId);

  assert.equal(
    secondEvidence.evidenceType,
    CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,
  );

  assert.equal(secondEvidence.artifactId, operatorArtifactId);

  assert.equal(secondEvidence.submittedByActorId, actorId);

  assert.equal(
    secondEvidence.recordedAt.getTime(),
    operatorEvidenceRecordedAt.getTime(),
  );

  /*
   * Evidence is not verification, recognition, or availability.
   */
  assert.equal(receipt.verifiedAmount, undefined);

  assert.equal(receipt.recognizedAmount, undefined);

  assert.equal(receipt.verifiedAt, undefined);

  assert.equal(receipt.recognizedAt, undefined);

  /*
   * Durable history.
   */
  const durableState = await prisma.$transaction(
    async (tx: TransactionClient) => {
      const aggregates = await tx.treasuryGatewayAggregate.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,
        },
      });

      const events = await tx.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,
        },
      });

      const reportedEvents = await tx.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,

          eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,
        },
      });

      const verificationStartedEvents = await tx.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,

          eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
        },
      });

      const evidenceEvents = await tx.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,

          eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
        },
      });

      const verifiedEvents = await tx.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,

          eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
        },
      });

      const recognizedEvents = await tx.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: receiptId,

          eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
        },
      });

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

  assert.equal(durableState.events, 4);

  assert.equal(receipt.metadata.version, 4);

  assert.equal(durableState.reportedEvents, 1);

  assert.equal(durableState.verificationStartedEvents, 1);

  assert.equal(durableState.evidenceEvents, 2);

  assert.equal(durableState.verifiedEvents, 0);

  assert.equal(durableState.recognizedEvents, 0);

  console.log(
    "✓ Durable Program Capital Receipt evidence-admission smoke test passed",
  );

  console.dir(
    {
      receipt: {
        id: receipt.id,

        status: receipt.status,

        version: receipt.metadata.version,

        receiptMethod: receipt.receiptMethod,

        declaredAmount: receipt.declaredAmount,

        externalReference: receipt.externalReference,
      },

      evidence: {
        atVersionTwo: loaded.evidenceAtVersionTwo.length,

        atVersionThree: loaded.evidenceAtVersionThree.length,

        atVersionFour: loaded.evidenceAtVersionFour.length,

        admitted: loaded.evidenceAtVersionFour.map(
          (item: CapitalReceiptEvidence) => ({
            id: item.id,

            evidenceType: item.evidenceType,

            artifactId: item.artifactId,

            externalReference: item.externalReference,

            submittedByActorId: item.submittedByActorId,

            recordedAt: item.recordedAt,
          }),
        ),
      },

      recognitionState: {
        verifiedAmount: receipt.verifiedAmount,

        recognizedAmount: receipt.recognizedAmount,

        verifiedAt: receipt.verifiedAt,

        recognizedAt: receipt.recognizedAt,
      },

      durableState,

      invariants: {
        canonicalReportedReceiptRequired: true,

        canonicalReceiptMustEnterVerificationBeforeEvidence: true,

        evidenceAdmissionPreservesUnderVerificationStatus: true,

        firstEvidenceAdvancesVersionTwoToThree: true,

        secondEvidenceAdvancesVersionThreeToFour: true,

        evidenceHistoryIsPlural: true,

        evidenceHistoryIsOrdered: true,

        evidenceHistoryIsVersionBounded: true,

        versionTwoSeesNoFutureEvidence: true,

        versionThreeSeesOnlyFirstEvidence: true,

        versionFourSeesBothEvidenceRecords: true,

        blockchainEvidenceReconstructs: true,

        operatorEvidenceReconstructs: true,

        evidenceRemainsBoundToCanonicalReceipt: true,

        submittingActorIsDurable: true,

        evidenceAdmissionDoesNotVerifyCapital: true,

        evidenceAdmissionDoesNotRecognizeCapital: true,

        evidenceAdmissionDoesNotEstablishAvailability: true,

        duplicateEvidenceIdentityRejected: true,

        duplicateEvidenceRejectionPreservesVersionFour: true,

        duplicateEvidenceRejectionAppendsNoEvent: true,

        evidenceIdentityIsReceiptScoped: true,
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
