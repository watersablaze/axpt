import assert from "node:assert/strict";

import type {
  PrismaClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_METHOD,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
} from "../../src/domains/treasury/gateway/capital-receipts/status";

import {
  getDigitalSettlementRecognitionReceiptCandidateHttp,
} from "../../src/domains/control-center/treasury/getDigitalSettlementRecognitionReceiptCandidateHttp";

const INSTRUMENT_REFERENCE =
  "FW-DSI-RB1C7B-001";

const INSTRUMENT_ID =
  "instrument-rb1c7b-001";

const VERSION_ID =
  "version-rb1c7b-001";

const SETTLEMENT_ID =
  "settlement-rb1c7b-001";

const OBSERVATION_ID =
  "observation-rb1c7b-001";

const RECOGNITION_EVENT_ID =
  "recognition-event-rb1c7b-001";

const RECEIPT_ID =
  `dsi-recognition-receipt:${OBSERVATION_ID}`;

const TRANSACTION_HASH =
  `0x${"ab".repeat(32)}`;

const RECEIVING_ADDRESS =
  "0x40143ECEF96EC52365c6E3164dE891C62c9A012E";

const RECEIVED_AT =
  new Date(
    "2026-09-22T12:00:00.000Z",
  );

const RECOGNIZED_AT =
  new Date(
    "2026-09-22T12:01:00.000Z",
  );

const CREATED_AT =
  new Date(
    "2026-09-22T12:02:00.000Z",
  );

function createPrisma(
  params?: {
    includeReceipt?:
      boolean;

    receiptTransactionHash?:
      string;
  },
): PrismaClient {
  /*
   * Treasury Gateway aggregate snapshots are persisted as JSON.
   *
   * Dates therefore exist in storage as ISO strings and are
   * reconstructed by decodeProgramCapitalReceiptSnapshot().
   */
  const receiptSnapshot = {
    id:
      RECEIPT_ID,

    reference:
      `DSI-RECOGNITION:${INSTRUMENT_ID}:${OBSERVATION_ID}`,

    programId:
      "program-rb1c7b-001",

    destinationProgramAccountId:
      "program-account-rb1c7b-001",

    declaredAmount: {
      amount:
        "50",

      currency:
        "USDT",
    },

    receiptMethod:
      CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

    externalReference:
      params?.receiptTransactionHash ??
      TRANSACTION_HASH,

    status:
      PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,

    receivedAt:
      RECEIVED_AT.toISOString(),

    metadata: {
      version:
        1,

      createdAt:
        CREATED_AT.toISOString(),

      updatedAt:
        CREATED_AT.toISOString(),

      createdByActorId:
        "treasury-operator-rb1c7b-001",

      lastModifiedByActorId:
        "treasury-operator-rb1c7b-001",
    },
  };

  const recognitionEvent = {
    id:
      RECOGNITION_EVENT_ID,

    payload: {
      instrumentId:
        INSTRUMENT_ID,

      settlementInstructionId:
        SETTLEMENT_ID,

      instrumentVersionId:
        VERSION_ID,

      observationId:
        OBSERVATION_ID,

      transactionHash:
        TRANSACTION_HASH,

      verificationAmountUsdt:
        "50",

      observedAmountUsdt:
        "50",

      observedReceivingAddress:
        RECEIVING_ADDRESS,

      tokenContractAddress:
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",

      chainId:
        1,

      recognizedAt:
        RECOGNIZED_AT.toISOString(),
    },

    occurredAt:
      RECOGNIZED_AT,
  };

  const prisma = {
    institutionalInstrument: {
      findUnique:
        async () => ({
          id:
            INSTRUMENT_ID,

          reference:
            INSTRUMENT_REFERENCE,

          digitalSettlementInstruction: {
            id:
              SETTLEMENT_ID,

            verificationTxHash:
              TRANSACTION_HASH,

            verificationObservationId:
              OBSERVATION_ID,

            verificationInstrumentVersionId:
              VERSION_ID,

            verificationConfirmedAt:
              RECOGNIZED_AT,

            verificationAmountUsdt: {
              toString:
                () => "50",
            },

            receivingAddress:
              RECEIVING_ADDRESS,

            settlementStatus:
              "AWAITING_TRANSFER",
          },

          versions: [
            {
              id:
                VERSION_ID,
            },
          ],
        }),
    },

    treasurySettlementObservation: {
      findUnique:
        async () => ({
          id:
            OBSERVATION_ID,

          chainId:
            1,

          network:
            "mainnet",

          tokenContractAddress:
            "0xdac17f958d2ee523a2206206994597c13d831ec7",

          txHash:
            TRANSACTION_HASH,

          logIndex:
            21,

          blockNumber:
            12345678n,

          blockHash:
            `0x${"cc".repeat(32)}`,

          fromAddress:
            "0x1111111111111111111111111111111111111111",

          toAddress:
            RECEIVING_ADDRESS,

          amountBaseUnits: {
            toString:
              () => "50000000",
          },

          direction:
            "IN",

          status:
            "CONFIRMED",

          detectedAt:
            RECEIVED_AT,

          chainTimestamp:
            RECEIVED_AT,

          validatedAt:
            RECEIVED_AT,

          confirmedAt:
            RECEIVED_AT,

          confirmationCount:
            24,

          requiredConfirmations:
            12,
        }),
    },

    domainEvent: {
      findMany:
        async () => [
          recognitionEvent,
        ],
    },

    treasuryGatewayAggregate: {
      findUnique:
        async () =>
          params?.includeReceipt
            ? {
                aggregateType:
                  "PROGRAM_CAPITAL_RECEIPT",

                aggregateId:
                  RECEIPT_ID,

                version:
                  1,

                status:
                  PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,

                snapshot:
                  receiptSnapshot,
              }
            : null,
    },
  };

  return prisma as unknown as
    PrismaClient;
}

async function main():
  Promise<void> {
  /*
   * Recognized source exists but Treasury has not
   * admitted it yet.
   */
  const available =
    await getDigitalSettlementRecognitionReceiptCandidateHttp({
      rawInstrumentReference:
        INSTRUMENT_REFERENCE,

      prisma:
        createPrisma(),
    });

  assert.equal(
    available.status,
    200,
  );

  assert.equal(
    available.body.ok,
    true,
  );

  if (
    !available.body.ok
  ) {
    throw new Error(
      "RB1C7B_AVAILABLE_PERCEPTION_FAILED",
    );
  }

  assert.equal(
    available.body.treasuryReceipt,
    null,
  );

  /*
   * Once reported, GET perception exposes the
   * existing canonical receipt without replaying
   * the reporting command.
   */
  const reported =
    await getDigitalSettlementRecognitionReceiptCandidateHttp({
      rawInstrumentReference:
        INSTRUMENT_REFERENCE,

      prisma:
        createPrisma({
          includeReceipt:
            true,
        }),
    });

  assert.equal(
    reported.status,
    200,
  );

  assert.equal(
    reported.body.ok,
    true,
  );

  if (
    !reported.body.ok
  ) {
    throw new Error(
      "RB1C7B_REPORTED_PERCEPTION_FAILED",
    );
  }

  assert.equal(
    reported.body.treasuryReceipt?.id,
    RECEIPT_ID,
  );

  assert.equal(
    reported.body.treasuryReceipt?.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(
    reported.body.treasuryReceipt?.programId,
    "program-rb1c7b-001",
  );

  assert.equal(
    reported.body.treasuryReceipt
      ?.destinationProgramAccountId,
    "program-account-rb1c7b-001",
  );

  assert.equal(
    reported.body.treasuryReceipt
      ?.externalReference,
    TRANSACTION_HASH,
  );

  /*
   * Existing Treasury state may not silently
   * diverge from the durable DSI source fact.
   */
  await assert.rejects(
    () =>
      getDigitalSettlementRecognitionReceiptCandidateHttp({
        rawInstrumentReference:
          INSTRUMENT_REFERENCE,

        prisma:
          createPrisma({
            includeReceipt:
              true,

            receiptTransactionHash:
              `0x${"ff".repeat(32)}`,
          }),
      }),

    /DSI_TREASURY_PERCEPTION_RECEIPT_TRANSACTION_MISMATCH/,
  );

  console.log(
    "DSI_TREASURY_PERCEPTION_AVAILABLE_CANDIDATE_OK",
  );

  console.log(
    "DSI_TREASURY_PERCEPTION_ALREADY_REPORTED_OK",
  );

  console.log(
    "DSI_TREASURY_PERCEPTION_CANONICAL_RECEIPT_ID_OK",
  );

  console.log(
    "DSI_TREASURY_PERCEPTION_RECEIPT_SOURCE_BINDING_OK",
  );

  console.log(
    "DSI_TREASURY_PERCEPTION_NO_REPORT_REPLAY_OK",
  );
}

main();
