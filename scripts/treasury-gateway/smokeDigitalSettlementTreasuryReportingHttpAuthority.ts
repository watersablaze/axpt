import assert from "node:assert/strict";

import type {
  PrismaClient,
} from "@prisma/client";

import type {
  Principal,
} from "../../src/domains/auth/types";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
} from "../../src/domains/treasury/gateway/capital-receipts/status";

import {
  TREASURY_EVENT_TYPE,
} from "../../src/domains/treasury/gateway/events/eventType";

import {
  reportDigitalSettlementRecognitionReceiptHttp,
} from "../../src/domains/control-center/treasury/reportDigitalSettlementRecognitionReceiptHttp";

import {
  DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE,
} from "../../src/domains/control-center/treasury/digitalSettlementReceiptAdmissionState";

const INSTRUMENT_REFERENCE =
  "FW-DSI-RB1C5B-001";

const INSTRUMENT_ID =
  "instrument-rb1c5b-001";

const VERSION_ID =
  "version-rb1c5b-001";

const SETTLEMENT_ID =
  "settlement-rb1c5b-001";

const OBSERVATION_ID =
  "observation-rb1c5b-001";

const RECOGNITION_EVENT_ID =
  "recognition-event-rb1c5b-001";

const TRANSACTION_HASH =
  `0x${"ab".repeat(32)}`;

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

const REPORTED_AT =
  new Date(
    "2026-09-22T12:02:00.000Z",
  );

const PRINCIPAL_USER_ID =
  "treasury-operator-rb1c5b-001";

const ATTACKER_ACTOR_ID =
  "browser-selected-fake-actor";

const PROGRAM_ID =
  "program-rb1c5b-001";

const DESTINATION_ACCOUNT_ID =
  "program-account-rb1c5b-001";

const AUTHORITY_GRANT_ID =
  "authority-grant-rb1c5b-001";

type AggregateRow = {
  aggregateType:
    string;

  aggregateId:
    string;

  version:
    number;

  status:
    string;

  snapshot:
    unknown;
};

type TreasuryEventRow = {
  eventId:
    string;

  aggregateType:
    string;

  aggregateId:
    string;

  aggregateVersion:
    number;

  eventType:
    string;

  actorId:
    string;

  authorityGrantId?:
    string;

  correlationId:
    string;

  causationId?:
    string;

  payload:
    unknown;

  occurredAt:
    Date;

  sequence:
    number;

  recordedAt:
    Date;

  previousEventHash:
    string | null;

  eventHash:
    string | null;
};

type CommandReceiptRow = {
  idempotencyKey:
    string;

  commandId:
    string;

  commandKind:
    string;

  aggregateType:
    string;

  aggregateId:
    string;

  actorId:
    string;

  correlationId:
    string;

  requestFingerprint:
    string;

  createdAt:
    Date;
};

function createRequest(
  overrides?:
    Readonly<
      Record<string, unknown>
    >,
): Request {
  return new Request(
    "http://localhost/api/admin/control-center/treasury/dsi-receipts/FW-DSI-RB1C5B-001/report",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({
          programId:
            PROGRAM_ID,

          destinationProgramAccountId:
            DESTINATION_ACCOUNT_ID,

          authorityGrantId:
            AUTHORITY_GRANT_ID,

          /*
           * Deliberately hostile / irrelevant caller fields.
           *
           * None of these may become Treasury source truth
           * or actor authority.
           */
          treasuryActorId:
            ATTACKER_ACTOR_ID,

          actorId:
            ATTACKER_ACTOR_ID,

          observationId:
            "browser-observation",

          instrumentVersionId:
            "browser-version",

          transactionHash:
            `0x${"ff".repeat(32)}`,

          verificationTxHash:
            `0x${"ee".repeat(32)}`,

          amount:
            "999999",

          receivedAt:
            "2099-01-01T00:00:00.000Z",

          recognizedAt:
            "2099-01-01T00:00:01.000Z",

          ...overrides,
        }),
    },
  );
}

async function main():
  Promise<void> {
  const aggregateRows:
    AggregateRow[] = [];

  const treasuryEventRows:
    TreasuryEventRow[] = [];

  const commandReceiptRows:
    CommandReceiptRow[] = [];

  const recognitionEvent = {
    id:
      RECOGNITION_EVENT_ID,

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
        "dsi-recognition-operator",
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

  const transactionClient = {
    /*
     * Durable DSI source reconstruction.
     */
    institutionalInstrument: {
      findUnique:
        async () => ({
          id:
            INSTRUMENT_ID,

          reference:
            INSTRUMENT_REFERENCE,

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
            17,

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

    /*
     * Treasury Gateway idempotency / persistence.
     */
    treasuryGatewayCommandReceipt: {
      findUnique:
        async ({
          where,
        }: {
          where: {
            idempotencyKey:
              string;
          };
        }) =>
          commandReceiptRows.find(
            (row) =>
              row.idempotencyKey ===
              where.idempotencyKey,
          ) ?? null,

      create:
        async ({
          data,
        }: {
          data:
            Omit<
              CommandReceiptRow,
              "createdAt"
            >;
        }) => {
          const row:
            CommandReceiptRow = {
            ...data,

            createdAt:
              REPORTED_AT,
          };

          commandReceiptRows.push(
            row,
          );

          return row;
        },
    },

    treasuryGatewayAggregate: {
      create:
        async ({
          data,
        }: {
          data:
            AggregateRow;
        }) => {
          aggregateRows.push(
            data,
          );

          return data;
        },

      findUnique:
        async ({
          where,
        }: {
          where: {
            aggregateType_aggregateId: {
              aggregateType:
                string;

              aggregateId:
                string;
            };
          };
        }) => {
          const {
            aggregateType,
            aggregateId,
          } =
            where.aggregateType_aggregateId;

          return (
            aggregateRows.find(
              (row) =>
                row.aggregateType ===
                  aggregateType &&
                row.aggregateId ===
                  aggregateId,
            ) ??
            null
          );
        },
    },

    treasuryGatewayEvent: {
      create:
        async ({
          data,
        }: {
          data:
            Omit<
              TreasuryEventRow,
              | "sequence"
              | "recordedAt"
              | "previousEventHash"
              | "eventHash"
            >;
        }) => {
          const row:
            TreasuryEventRow = {
            ...data,

            sequence:
              treasuryEventRows.length +
              1,

            recordedAt:
              REPORTED_AT,

            previousEventHash:
              null,

            eventHash:
              null,
          };

          treasuryEventRows.push(
            row,
          );

          return row;
        },
    },
  };

  const prisma = {
    $transaction:
      async (
        callback:
          (
            tx:
              typeof transactionClient,
          ) => Promise<unknown>,
      ) =>
        callback(
          transactionClient,
        ),
  } as unknown as
    PrismaClient;

  const principal:
    Principal = {
    userId:
      PRINCIPAL_USER_ID,

    email:
      "treasury.operator@axpt.io",

    roles:
      [],

    permissions:
      [],
  };

  /*
   * FIRST TREASURY OPERATOR REPORT.
   */
  const first =
    await reportDigitalSettlementRecognitionReceiptHttp({
      rawInstrumentReference:
        INSTRUMENT_REFERENCE,

      request:
        createRequest(),

      principal,

      prisma,

      now:
        () =>
          REPORTED_AT,
    });

  assert.equal(
    first.status,
    201,
  );

  assert.equal(
    first.body.ok,
    true,
  );

  if (!first.body.ok) {
    throw new Error(
      "RB1C5B_FIRST_REPORT_FAILED",
    );
  }

  assert.equal(
    first.body.state,
    DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ALREADY_REPORTED,
  );

  assert.equal(
    first.body.disposition,
    "REPORTED",
  );

  assert.equal(
    first.body.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(
    first.body.receipt.programId,
    PROGRAM_ID,
  );

  assert.equal(
    first.body.receipt.destinationProgramAccountId,
    DESTINATION_ACCOUNT_ID,
  );

  assert.deepEqual(
    first.body.receipt.declaredAmount,
    {
      amount:
        "50",

      currency:
        "USDT",
    },
  );

  assert.equal(
    first.body.receipt.externalReference,
    TRANSACTION_HASH,
  );

  /*
   * The browser attempted to substitute actor identity.
   *
   * Treasury command authorship must still be the
   * authenticated Principal.
   */
  assert.equal(
    commandReceiptRows.length,
    1,
  );

  assert.equal(
    commandReceiptRows[0]
      .actorId,
    PRINCIPAL_USER_ID,
  );

  assert.notEqual(
    commandReceiptRows[0]
      .actorId,
    ATTACKER_ACTOR_ID,
  );

  assert.equal(
    treasuryEventRows.length,
    1,
  );

  assert.equal(
    treasuryEventRows[0]
      .actorId,
    PRINCIPAL_USER_ID,
  );

  assert.equal(
    treasuryEventRows[0]
      .authorityGrantId,
    AUTHORITY_GRANT_ID,
  );

  /*
   * The browser also attempted to substitute
   * blockchain / recognition facts.
   *
   * Durable institutional state must win.
   */
  assert.equal(
    first.body.receipt.externalReference,
    TRANSACTION_HASH,
  );

  assert.notEqual(
    first.body.receipt.externalReference,
    `0x${"ff".repeat(32)}`,
  );

  assert.deepEqual(
    first.body.receipt.declaredAmount,
    {
      amount:
        "50",

      currency:
        "USDT",
    },
  );

  assert.equal(
    treasuryEventRows[0]
      .causationId,
    RECOGNITION_EVENT_ID,
  );

  assert.equal(
    treasuryEventRows[0]
      .eventType,
    TREASURY_EVENT_TYPE
      .CAPITAL_RECEIPT_REPORTED,
  );

  /*
   * EXACT REPLAY.
   *
   * A second operator submission for the same
   * canonical observation and same routing must
   * resolve to the same receipt without another
   * aggregate, event, or command receipt.
   */
  const replay =
    await reportDigitalSettlementRecognitionReceiptHttp({
      rawInstrumentReference:
        INSTRUMENT_REFERENCE,

      request:
        createRequest(),

      principal,

      prisma,

      now:
        () =>
          new Date(
            "2026-09-22T12:03:00.000Z",
          ),
    });

  assert.equal(
    replay.status,
    200,
  );

  assert.equal(
    replay.body.ok,
    true,
  );

  if (!replay.body.ok) {
    throw new Error(
      "RB1C5B_REPLAY_FAILED",
    );
  }

  assert.equal(
    replay.body.state,
    DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ALREADY_REPORTED,
  );

  assert.equal(
    replay.body.disposition,
    "REPLAYED",
  );

  assert.equal(
    replay.body.receipt.id,
    first.body.receipt.id,
  );

  assert.equal(
    aggregateRows.length,
    1,
  );

  assert.equal(
    treasuryEventRows.length,
    1,
  );

  assert.equal(
    commandReceiptRows.length,
    1,
  );

  /*
   * ROUTING CHANGE IS NOT A REPLAY.
   *
   * The canonical observation owns one deterministic
   * receipt identity. Attempting to report the same
   * recognized fact to a different Treasury route is
   * therefore an idempotency collision, not a second
   * receipt.
   */
  const reroute =
    await reportDigitalSettlementRecognitionReceiptHttp({
      rawInstrumentReference:
        INSTRUMENT_REFERENCE,

      request:
        createRequest({
          destinationProgramAccountId:
            "program-account-rb1c5b-different",
        }),

      principal,

      prisma,

      now:
        () =>
          new Date(
            "2026-09-22T12:04:00.000Z",
          ),
    });

  assert.equal(
    reroute.status,
    409,
  );

  assert.equal(
    reroute.body.ok,
    false,
  );

  if (reroute.body.ok) {
    throw new Error(
      "RB1C5B_REROUTE_UNEXPECTEDLY_ACCEPTED",
    );
  }

  assert.equal(
    reroute.body.state,
    DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ROUTING_COLLISION,
  );

  assert.equal(
    reroute.body.error,
    "DSI_TREASURY_RECEIPT_IDEMPOTENCY_COLLISION",
  );

  assert.equal(
    aggregateRows.length,
    1,
  );

  assert.equal(
    treasuryEventRows.length,
    1,
  );

  assert.equal(
    commandReceiptRows.length,
    1,
  );

  recognitionEvent.payload.transactionHash =
    `0x${"ff".repeat(32)}`;

  const integrityFailure =
    await reportDigitalSettlementRecognitionReceiptHttp({
      rawInstrumentReference:
        INSTRUMENT_REFERENCE,

      request:
        createRequest(),

      principal,

      prisma,

      now:
        () =>
          new Date(
            "2026-09-22T12:05:00.000Z",
          ),
    });

  assert.equal(
    integrityFailure.status,
    500,
  );

  assert.equal(
    integrityFailure.body.ok,
    false,
  );

  if (
    integrityFailure.body.ok
  ) {
    throw new Error(
      "RB1C8C_INTEGRITY_FAILURE_UNEXPECTEDLY_ACCEPTED",
    );
  }

  assert.equal(
    integrityFailure.body.state,
    DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.INTEGRITY_FAILURE,
  );

  assert.equal(
    integrityFailure.body.error,
    "DSI_TREASURY_INTEGRITY_FAILURE",
  );

  assert.equal(
    aggregateRows.length,
    1,
  );

  assert.equal(
    treasuryEventRows.length,
    1,
  );

  assert.equal(
    commandReceiptRows.length,
    1,
  );

  console.log(
    "DSI_TREASURY_HTTP_REPORT_CREATED_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_ACTOR_FROM_PRINCIPAL_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_BROWSER_ACTOR_REJECTED_AS_AUTHORITY_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_DURABLE_SOURCE_FACT_WINS_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_ROUTING_EXPLICIT_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_REPLAY_IDEMPOTENT_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_REROUTE_COLLISION_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_STOPS_AT_REPORTED_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_STATE_ALREADY_REPORTED_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_STATE_ROUTING_COLLISION_OK",
  );

  console.log(
    "DSI_TREASURY_HTTP_INTEGRITY_FAILS_CLOSED_OK",
  );
}

main();
