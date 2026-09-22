import assert from "node:assert/strict";

import {
  recognizeDigitalSettlementVerificationWithClient,
  type DigitalSettlementVerificationRecognitionClient,
} from "../../src/domains/instruments/verification-recognition";

const REFERENCE =
  "FW-DSI-2026-001";

const OPERATIONS_WALLET =
  "0x40143ECEF96EC52365c6E3164dE891C62c9A012E";

const TRANSACTION_HASH =
  `0x${"ab".repeat(32)}`;

const ISSUED_AT =
  new Date(
    "2026-09-20T18:39:17.474Z",
  );

const CHAIN_TIMESTAMP =
  new Date(
    "2026-09-20T19:00:00.000Z",
  );

async function main() {
  const settlement = {
    id:
      "settlement-1",

    settlementAsset:
      "USDT",

    settlementNetwork:
      "ETHEREUM_ERC20",

    receivingAddress:
      OPERATIONS_WALLET,

    verificationAmountUsdt: {
      toString: () =>
        "50.000000",
    },

    verificationTxHash:
      null as string | null,

    verificationObservationId:
      null as string | null,

    verificationInstrumentVersionId:
      null as string | null,

    verificationConfirmedAt:
      null as Date | null,

    principalAuthorizedAt:
      null as Date | null,

    settlementAmountUsd: {
      toString: () =>
        "471812.40",
    },

    settlementStatus:
      "AWAITING_VERIFICATION_TRANSFER",
  };

  const domainEvents:
    Array<Record<string, any>> = [];

  const instrument = {
    id:
      "instrument-1",

    reference:
      REFERENCE,

    status:
      "ISSUED",

    currentVersion:
      1,

    versions: [
      {
        id:
          "version-1",

        number:
          1,

        status:
          "ISSUED",

        issuedAt:
          ISSUED_AT,
      },
    ],

    digitalSettlementInstruction:
      settlement,
  };

  const client = {
    institutionalInstrument: {
      async findUnique() {
        return instrument;
      },

      async findMany() {
        return [];
      },
    },

    treasurySettlementObservation: {
      async findUnique(args: any) {
        if (
          args.where.id !==
          "observation-1"
        ) {
          return null;
        }

        return {
          id:
            "observation-1",

          txHash:
            TRANSACTION_HASH,

          logIndex:
            4,
        };
      },

      async findMany() {
        return [
          {
            id:
              "observation-1",

            txHash:
              TRANSACTION_HASH,

            logIndex:
              4,

            blockNumber:
              26019000n,

            blockHash:
              `0x${"cd".repeat(32)}`,

            chainTimestamp:
              CHAIN_TIMESTAMP,

            fromAddress:
              "0x1111111111111111111111111111111111111111",

            toAddress:
              OPERATIONS_WALLET.toLowerCase(),

            amountBaseUnits:
              "50000000",

            confirmedAt:
              new Date(
                "2026-09-20T19:05:00.000Z",
              ),

            confirmationCount:
              12,

            requiredConfirmations:
              12,
          },
        ];
      },
    },

    digitalSettlementInstruction: {
      async updateMany(args: any) {
        if (
          settlement.settlementStatus !==
          args.where.settlementStatus
        ) {
          return {
            count:
              0,
          };
        }

        Object.assign(
          settlement,
          args.data,
        );

        return {
          count:
            1,
        };
      },
    },

    domainEvent: {
      async create(args: any) {
        domainEvents.push(
          args.data,
        );

        return args.data;
      },
    },
  } as unknown as
    DigitalSettlementVerificationRecognitionClient;

  const submitted = {
    transactionHash:
      TRANSACTION_HASH,

    observedAmountUsdt:
      "50",

    observedReceivingAddress:
      OPERATIONS_WALLET,
  };

  const first =
    await recognizeDigitalSettlementVerificationWithClient({
      client,
      instrumentReference:
        REFERENCE,
      submitted,
      actorUserId:
        "operator-1",
      recognizedAt:
        new Date(
          "2026-09-20T19:06:00.000Z",
        ),
    });

  assert.equal(
    first.disposition,
    "RECOGNIZED",
  );
  assert.equal(
    first.confirmation.confirmed,
    true,
  );
  assert.equal(
    settlement.settlementStatus,
    "VERIFICATION_CONFIRMED",
  );
  assert.equal(
    settlement.verificationTxHash,
    TRANSACTION_HASH,
  );

  assert.equal(
    settlement.verificationObservationId,
    "observation-1",
  );

  assert.equal(
    settlement.verificationInstrumentVersionId,
    "version-1",
  );
  assert.equal(
    settlement.principalAuthorizedAt,
    null,
  );
  assert.equal(
    settlement.settlementAmountUsd.toString(),
    "471812.40",
  );
  assert.equal(
    domainEvents.length,
    1,
  );
  assert.equal(
    domainEvents[0]
      .eventType,
    "SETTLEMENT_VERIFICATION_CONFIRMED",
  );

  assert.equal(
    domainEvents[0]
      .payload
      .observationId,
    "observation-1",
  );

  assert.equal(
    domainEvents[0]
      .payload
      .instrumentVersionId,
    "version-1",
  );

  const replay =
    await recognizeDigitalSettlementVerificationWithClient({
      client,
      instrumentReference:
        REFERENCE,
      submitted,
      actorUserId:
        "operator-1",
    });

  assert.equal(
    replay.disposition,
    "ALREADY_RECOGNIZED",
  );
  assert.equal(
    replay.confirmation.confirmed,
    false,
  );
  assert.equal(
    domainEvents.length,
    1,
  );

  await assert.rejects(
    () =>
      recognizeDigitalSettlementVerificationWithClient({
        client,
        instrumentReference:
          REFERENCE,
        submitted: {
          ...submitted,
          observedAmountUsdt:
            "51",
        },
        actorUserId:
          "operator-1",
      }),
    /DSI_VERIFICATION_AMOUNT_MISMATCH/,
  );

  await assert.rejects(
    () =>
      recognizeDigitalSettlementVerificationWithClient({
        client,
        instrumentReference:
          REFERENCE,
        submitted: {
          ...submitted,
          observedReceivingAddress:
            "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F",
        },
        actorUserId:
          "operator-1",
      }),
    /DSI_VERIFICATION_RECEIVING_ADDRESS_MISMATCH/,
  );

  assert.equal(
    settlement.principalAuthorizedAt,
    null,
  );
  assert.equal(
    settlement.settlementStatus,
    "VERIFICATION_CONFIRMED",
  );

  console.log(
    "DIGITAL_SETTLEMENT_OBSERVED_RECOGNITION_OK",
  );
  console.log(
    "DSI_RECOGNITION_CANONICAL_OBSERVATION_BOUND_OK",
  );
  console.log(
    "DSI_RECOGNITION_EXACT_VERSION_BOUND_OK",
  );
  console.log(
    "TAP_AUTHORITY_REMAINS_SEPARATE_OK",
  );
  console.log(
    "RECOGNITION_REPLAY_IDEMPOTENT_OK",
  );
}

main().catch(
  (error) => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);
