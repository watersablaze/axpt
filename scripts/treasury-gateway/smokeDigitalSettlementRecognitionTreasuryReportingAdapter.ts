import assert from "node:assert/strict";

import type {
  TransactionClient,
} from "@prisma/client";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
} from "../../src/domains/treasury/gateway/capital-receipts/status";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  TREASURY_EVENT_TYPE,
} from "../../src/domains/treasury/gateway/events/eventType";

import {
  reportDigitalSettlementRecognitionToTreasuryWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/intake/reportDigitalSettlementRecognitionToTreasuryWithClient";

import type {
  DigitalSettlementRecognitionTreasuryIntake,
} from "../../src/domains/treasury/gateway/capital-receipts/intake/digitalSettlementRecognitionIntake";

const OBSERVATION_ID =
  "observation-rb1c4-001";

const INSTRUMENT_ID =
  "instrument-rb1c4-001";

const RECOGNITION_EVENT_ID =
  "domain-event-rb1c4-001";

const TRANSACTION_HASH =
  `0x${"cd".repeat(32)}`;

const RECOGNIZED_AT =
  new Date(
    "2026-09-22T12:01:00.000Z",
  );

const REPORTED_AT =
  new Date(
    "2026-09-22T12:02:00.000Z",
  );

function createIntake():
  DigitalSettlementRecognitionTreasuryIntake {
  return {
    source: {
      recognitionEventId:
        RECOGNITION_EVENT_ID,

      instrumentId:
        INSTRUMENT_ID,

      instrumentVersionId:
        "instrument-version-rb1c4-001",

      settlementInstructionId:
        "settlement-rb1c4-001",

      observationId:
        OBSERVATION_ID,

      chainId:
        1,

      transactionHash:
        TRANSACTION_HASH,

      logIndex:
        9,

      tokenContractAddress:
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",

      receivingAddress:
        "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",

      amount: {
        amount:
          "50",

        currency:
          "USDT",
      },

      receivedAt:
        new Date(
          "2026-09-22T12:00:00.000Z",
        ),

      recognizedAt:
        RECOGNIZED_AT,
    },

    routing: {
      programId:
        "program-rb1c4-001",

      destinationProgramAccountId:
        "program-account-rb1c4-001",

      treasuryActorId:
        "treasury-actor-rb1c4-001",

      authorityGrantId:
        "treasury-authority-rb1c4-001",
    },
  };
}

type AggregateRow = {
  aggregateType: string;
  aggregateId: string;
  version: number;
  status: string;
  snapshot: unknown;
};

type EventRow = {
  eventId: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  eventType: string;
  actorId: string;
  authorityGrantId?: string;
  correlationId: string;
  causationId?: string;
  payload: unknown;
  occurredAt: Date;
  sequence: number;
  recordedAt: Date;
  previousEventHash: string | null;
  eventHash: string | null;
};

type CommandReceiptRow = {
  idempotencyKey: string;
  commandId: string;
  commandKind: string;
  aggregateType: string;
  aggregateId: string;
  actorId: string;
  correlationId: string;
  requestFingerprint: string;
  createdAt: Date;
};

async function main(): Promise<void> {
  const aggregateRows:
    AggregateRow[] = [];

  const eventRows:
    EventRow[] = [];

  const commandReceiptRows:
    CommandReceiptRow[] = [];

  const client = {
    treasuryGatewayCommandReceipt: {
      findUnique: async ({
        where,
      }: {
        where: {
          idempotencyKey: string;
        };
      }) =>
        commandReceiptRows.find(
          (row) =>
            row.idempotencyKey ===
            where.idempotencyKey,
        ) ?? null,

      create: async ({
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
            new Date(
              "2026-09-22T12:02:01.000Z",
            ),
        };

        commandReceiptRows.push(
          row,
        );

        return row;
      },
    },

    treasuryGatewayAggregate: {
      create: async ({
        data,
      }: {
        data: AggregateRow;
      }) => {
        aggregateRows.push(
          data,
        );

        return data;
      },

      findUnique: async ({
        where,
      }: {
        where: {
          aggregateType_aggregateId: {
            aggregateType: string;
            aggregateId: string;
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
          ) ?? null
        );
      },
    },

    treasuryGatewayEvent: {
      create: async ({
        data,
      }: {
        data:
          Omit<
            EventRow,
            | "sequence"
            | "recordedAt"
            | "previousEventHash"
            | "eventHash"
          >;
      }) => {
        const row:
          EventRow = {
          ...data,

          sequence:
            eventRows.length + 1,

          recordedAt:
            new Date(
              "2026-09-22T12:02:01.000Z",
            ),

          previousEventHash:
            null,

          eventHash:
            null,
        };

        eventRows.push(
          row,
        );

        return row;
      },
    },
  } as unknown as TransactionClient;

  const intake =
    createIntake();

  /*
   * First governed handoff.
   */
  const first =
    await reportDigitalSettlementRecognitionToTreasuryWithClient({
      intake,

      reportedAt:
        REPORTED_AT,

      client,
    });

  assert.equal(
    first.report.disposition,
    "REPORTED",
  );

  assert.equal(
    first.report.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(
    first.report.aggregate.metadata.version,
    1,
  );

  assert.equal(
    first.report.aggregate.programId,
    intake.routing.programId,
  );

  assert.equal(
    first.report.aggregate.destinationProgramAccountId,
    intake.routing.destinationProgramAccountId,
  );

  assert.deepEqual(
    first.report.aggregate.declaredAmount,
    {
      amount:
        "50",

      currency:
        "USDT",
    },
  );

  assert.equal(
    first.report.aggregate.externalReference,
    TRANSACTION_HASH,
  );

  assert.equal(
    first.report.aggregate.verifiedAmount,
    undefined,
  );

  assert.equal(
    first.report.aggregate.recognizedAmount,
    undefined,
  );

  assert.equal(
    first.report.aggregate.verifiedAt,
    undefined,
  );

  assert.equal(
    first.report.aggregate.recognizedAt,
    undefined,
  );

  assert.equal(
    first.identity.causationId,
    RECOGNITION_EVENT_ID,
  );

  assert.equal(
    first.identity.receiptId,
    `dsi-recognition-receipt:${OBSERVATION_ID}`,
  );

  /*
   * Exact replay.
   *
   * A later transport/report attempt must resolve
   * to the same canonical Treasury receipt.
   */
  const replay =
    await reportDigitalSettlementRecognitionToTreasuryWithClient({
      intake:
        createIntake(),

      reportedAt:
        new Date(
          "2026-09-22T12:03:00.000Z",
        ),

      client,
    });

  assert.equal(
    replay.report.disposition,
    "REPLAYED",
  );

  assert.equal(
    replay.report.aggregate.id,
    first.report.aggregate.id,
  );

  assert.equal(
    replay.report.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  /*
   * Reporting cannot predate the recognition act.
   */
  await assert.rejects(
    () =>
      reportDigitalSettlementRecognitionToTreasuryWithClient({
        intake:
          createIntake(),

        reportedAt:
          new Date(
            "2026-09-22T12:00:59.000Z",
          ),

        client,
      }),

    /DSI_TREASURY_REPORT_BEFORE_RECOGNITION/,
  );

  /*
   * Durable consequences remain exactly:
   *
   * one ProgramCapitalReceipt aggregate
   * one CAPITAL_RECEIPT_REPORTED event
   * one idempotency command receipt
   */
  assert.equal(
    aggregateRows.length,
    1,
  );

  assert.equal(
    eventRows.length,
    1,
  );

  assert.equal(
    commandReceiptRows.length,
    1,
  );

  assert.equal(
    aggregateRows[0]
      .aggregateType,
    TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,
  );

  assert.equal(
    aggregateRows[0]
      .status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(
    eventRows[0]
      .eventType,
    TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,
  );

  assert.equal(
    eventRows[0]
      .causationId,
    RECOGNITION_EVENT_ID,
  );

  const forbiddenEventTypes =
    new Set([
      TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
      TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
      TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
      TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
    ]);

  assert.equal(
    eventRows.some(
      (event) =>
        forbiddenEventTypes.has(
          event.eventType as
            | typeof TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED
            | typeof TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED
            | typeof TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED
            | typeof TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
        ),
    ),
    false,
  );

  console.log(
    "DSI_TREASURY_RECEIPT_REPORTED_OK",
  );

  console.log(
    "DSI_TREASURY_RECEIPT_REPLAY_IDEMPOTENT_OK",
  );

  console.log(
    "DSI_TREASURY_RECOGNITION_CAUSES_REPORT_OK",
  );

  console.log(
    "DSI_TREASURY_RECEIPT_REMAINS_UNVERIFIED_OK",
  );

  console.log(
    "DSI_TREASURY_RECEIPT_REMAINS_UNRECOGNIZED_OK",
  );

  console.log(
    "DSI_TREASURY_NO_EVIDENCE_ADMISSION_OK",
  );

  console.log(
    "DSI_TREASURY_NO_AVAILABILITY_OR_EXECUTION_AUTHORITY_OK",
  );
}

main();
