import assert from "node:assert/strict";

import type {
  DigitalSettlementTreasuryReceiptCandidateClient,
} from "../../src/domains/treasury/gateway/capital-receipts/intake/prepareDigitalSettlementTreasuryReceiptCandidateWithClient";

import {
  prepareDigitalSettlementTreasuryReceiptCandidateWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/intake/prepareDigitalSettlementTreasuryReceiptCandidateWithClient";

const INSTRUMENT_ID =
  "instrument-rb1c5a-001";

const VERSION_ID =
  "version-rb1c5a-001";

const SETTLEMENT_ID =
  "settlement-rb1c5a-001";

const OBSERVATION_ID =
  "observation-rb1c5a-001";

const EVENT_ID =
  "recognition-event-rb1c5a-001";

const TRANSACTION_HASH =
  `0x${"ef".repeat(32)}`;

const RECEIVING_ADDRESS =
  "0x40143ECEF96EC52365c6E3164dE891C62c9A012E";

const RECOGNIZED_AT =
  new Date(
    "2026-09-22T12:01:00.000Z",
  );

const RECEIVED_AT =
  new Date(
    "2026-09-22T12:00:00.000Z",
  );

function createClient(params?: {
  currentSettlementStatus?:
    string;

  duplicateRecognitionEvent?:
    boolean;

  eventObservationId?:
    string;
}):
  DigitalSettlementTreasuryReceiptCandidateClient {
  const event = {
    id:
      EVENT_ID,

    streamType:
      "INSTITUTIONAL_INSTRUMENT",

    streamId:
      INSTRUMENT_ID,

    eventType:
      "SETTLEMENT_VERIFICATION_RECOGNIZED",

    eventVersion:
      1,

    payload: {
      instrumentId:
        INSTRUMENT_ID,

      settlementInstructionId:
        SETTLEMENT_ID,

      instrumentVersionId:
        VERSION_ID,

      observationId:
        params?.eventObservationId ??
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

      from:
        "AWAITING_VERIFICATION_TRANSFER",

      to:
        "VERIFICATION_CONFIRMED",

      recognizedAt:
        RECOGNIZED_AT.toISOString(),
    },

    metadata: {
      actorUserId:
        "operator-rb1c5a-001",
    },

    occurredAt:
      RECOGNIZED_AT,

    processedAt:
      null,

    failedAt:
      null,

    errorMessage:
      null,

    createdAt:
      RECOGNIZED_AT,
  };

  return {
    institutionalInstrument: {
      findUnique:
        async () => ({
          id:
            INSTRUMENT_ID,

          reference:
            "FW-DSI-RB1C5A-001",

          currentVersion:
            2,

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
              params?.currentSettlementStatus ??
              "VERIFICATION_CONFIRMED",
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
            11,

          blockNumber:
            12345678n,

          blockHash:
            `0x${"aa".repeat(32)}`,

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
        async () =>
          params?.duplicateRecognitionEvent
            ? [
                event,
                {
                  ...event,

                  id:
                    "recognition-event-rb1c5a-duplicate",
                },
              ]
            : [
                event,
              ],
    },
  } as unknown as
    DigitalSettlementTreasuryReceiptCandidateClient;
}

async function main():
  Promise<void> {
  const candidate =
    await prepareDigitalSettlementTreasuryReceiptCandidateWithClient({
      instrumentReference:
        "FW-DSI-RB1C5A-001",

      client:
        createClient(),
    });

  assert.equal(
    candidate.recognitionEventId,
    EVENT_ID,
  );

  assert.equal(
    candidate.instrumentId,
    INSTRUMENT_ID,
  );

  assert.equal(
    candidate.instrumentVersionId,
    VERSION_ID,
  );

  assert.equal(
    candidate.settlementInstructionId,
    SETTLEMENT_ID,
  );

  assert.equal(
    candidate.observationId,
    OBSERVATION_ID,
  );

  assert.equal(
    candidate.transactionHash,
    TRANSACTION_HASH,
  );

  assert.equal(
    candidate.logIndex,
    11,
  );

  assert.deepEqual(
    candidate.amount,
    {
      amount:
        "50",

      currency:
        "USDT",
    },
  );

  assert.equal(
    candidate.receivedAt.getTime(),
    RECEIVED_AT.getTime(),
  );

  assert.equal(
    candidate.recognizedAt.getTime(),
    RECOGNIZED_AT.getTime(),
  );

  /*
   * Reportability survives legitimate later DSI lifecycle advancement.
   *
   * The source fact was recognized durably already.
   */
  const advancedCandidate =
    await prepareDigitalSettlementTreasuryReceiptCandidateWithClient({
      instrumentReference:
        "FW-DSI-RB1C5A-001",

      client:
        createClient({
          currentSettlementStatus:
            "AWAITING_TRANSFER",
        }),
    });

  assert.equal(
    advancedCandidate.observationId,
    OBSERVATION_ID,
  );

  /*
   * Recognition event cardinality remains exact.
   */
  await assert.rejects(
    () =>
      prepareDigitalSettlementTreasuryReceiptCandidateWithClient({
        instrumentReference:
          "FW-DSI-RB1C5A-001",

        client:
          createClient({
            duplicateRecognitionEvent:
              true,
          }),
      }),

    /DSI_TREASURY_CANDIDATE_RECOGNITION_EVENT_CARDINALITY/,
  );

  /*
   * Event bindings may not diverge from persisted DSI recognition.
   */
  await assert.rejects(
    () =>
      prepareDigitalSettlementTreasuryReceiptCandidateWithClient({
        instrumentReference:
          "FW-DSI-RB1C5A-001",

        client:
          createClient({
            eventObservationId:
              "observation-foreign",
          }),
      }),

    /DSI_TREASURY_CANDIDATE_RECOGNITION_EVENT_CARDINALITY/,
  );

  assert.equal(
    "programId" in candidate,
    false,
  );

  assert.equal(
    "destinationProgramAccountId" in candidate,
    false,
  );

  assert.equal(
    "treasuryActorId" in candidate,
    false,
  );

  console.log(
    "DSI_TREASURY_REPORTABLE_CANDIDATE_OK",
  );

  console.log(
    "DSI_TREASURY_CANDIDATE_DURABLE_BINDINGS_OK",
  );

  console.log(
    "DSI_TREASURY_CANDIDATE_EXACT_RECOGNITION_EVENT_OK",
  );

  console.log(
    "DSI_TREASURY_CANDIDATE_SURVIVES_DSI_ADVANCEMENT_OK",
  );

  console.log(
    "DSI_TREASURY_CANDIDATE_NO_ROUTING_AUTHORITY_OK",
  );
}

main();
