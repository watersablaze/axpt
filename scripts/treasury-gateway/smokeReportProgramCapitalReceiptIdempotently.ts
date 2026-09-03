import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { CAPITAL_RECEIPT_METHOD } from "../../src/domains/treasury/gateway/capital-receipts/contracts";

import { reportProgramCapitalReceiptIdempotentlyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

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

function createRequest(params: {
  fixtureId: string;
  suffix: string;
  actorId: string;
  idempotencyKey: string;
  receiptId?: string;
  externalReference?: string;
  declaredAmount?: string;
  receivedAt?: Date;
}) {
  const {
    fixtureId,
    suffix,
    actorId,
    idempotencyKey,
    receiptId = `capital-receipt-${suffix}-${fixtureId}`,
    externalReference = `0x${fixtureId.replace(/-/g, "")}`,
    declaredAmount = "600000.00",
    receivedAt = new Date("2026-09-03T14:00:00.000Z"),
  } = params;

  return {
    receiptId,

    reference: `DONGIN-USDT-ACTIVATION-${fixtureId}`,

    eventId: `capital-receipt-reported-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capital-receipt-report-command-${suffix}-${fixtureId}`,

      actorId,

      correlationId: `capital-receipt-report-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-09-03T14:01:00.000Z"),

      idempotencyKey,
    },

    payload: {
      programId: `dongin-program-${fixtureId}`,

      destinationProgramAccountId: `dongin-usdt-program-account-${fixtureId}`,

      receivedFromPartyId: `dongin-party-${fixtureId}`,

      declaredAmount: {
        amount: declaredAmount,

        currency: "USDT",
      },

      receiptMethod: CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

      externalReference,

      expectedAt: new Date("2026-09-03T13:30:00.000Z"),

      receivedAt,
    },
  };
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const actorId = `capital-receipt-operator-${fixtureId}`;

  const idempotencyKey = `capital-receipt-report-idempotency-${fixtureId}`;

  const firstRequest = createRequest({
    fixtureId,

    suffix: "first",

    actorId,

    idempotencyKey,
  });

  try {
    /*
     * First report.
     */
    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      reportProgramCapitalReceiptIdempotentlyWithClient({
        request: firstRequest,

        client: tx,
      }),
    );

    assert.equal(first.disposition, "REPORTED");

    assert.equal(
      first.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
    );

    assert.equal(first.aggregate.metadata.version, 1);

    assert.equal(
      first.aggregate.receiptMethod,
      CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,
    );

    assert.deepEqual(first.aggregate.declaredAmount, {
      amount: "600000.00",

      currency: "USDT",
    });

    assert.equal(
      first.aggregate.externalReference,
      firstRequest.payload.externalReference,
    );

    assert.equal(first.aggregate.verifiedAmount, undefined);
    assert.equal(first.aggregate.recognizedAmount, undefined);
    assert.equal(first.aggregate.verifiedAt, undefined);
    assert.equal(first.aggregate.recognizedAt, undefined);

    const canonicalReceiptId = first.aggregate.id;

    /*
     * Canonical reload.
     */
    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId: canonicalReceiptId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(
      loaded.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
    );

    assert.equal(loaded.aggregate.metadata.version, 1);

    assert.equal(loaded.aggregate.verifiedAmount, undefined);
    assert.equal(loaded.aggregate.recognizedAmount, undefined);
    assert.equal(loaded.aggregate.verifiedAt, undefined);
    assert.equal(loaded.aggregate.recognizedAt, undefined);

    /*
     * Exact retry with fresh transport identities.
     */
    const retryRequest = createRequest({
      fixtureId,

      suffix: "retry",

      actorId,

      idempotencyKey,

      receiptId: `capital-receipt-retry-${fixtureId}`,
    });

    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      reportProgramCapitalReceiptIdempotentlyWithClient({
        request: retryRequest,

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(retry.aggregate.id, canonicalReceiptId);

    assert.equal(
      retry.aggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
    );

    assert.equal(retry.aggregate.metadata.version, 1);

    /*
     * Same key + changed material receipt must collide.
     */
    let changedAmountError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        reportProgramCapitalReceiptIdempotentlyWithClient({
          request: createRequest({
            fixtureId,

            suffix: "changed-amount",

            actorId,

            idempotencyKey,

            declaredAmount: "600001.00",
          }),

          client: tx,
        }),
      );
    } catch (error: unknown) {
      changedAmountError = error;
    }

    assertErrorCode(
      changedAmountError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * Same key + changed external transaction identity must collide.
     */
    let changedExternalReferenceError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        reportProgramCapitalReceiptIdempotentlyWithClient({
          request: createRequest({
            fixtureId,

            suffix: "changed-external-reference",

            actorId,

            idempotencyKey,

            externalReference: `0xchanged${fixtureId.replace(/-/g, "")}`,
          }),

          client: tx,
        }),
      );
    } catch (error: unknown) {
      changedExternalReferenceError = error;
    }

    assertErrorCode(
      changedExternalReferenceError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * Same key + changed actor must collide.
     */
    let changedActorError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        reportProgramCapitalReceiptIdempotentlyWithClient({
          request: createRequest({
            fixtureId,

            suffix: "changed-actor",

            actorId: `other-operator-${fixtureId}`,

            idempotencyKey,
          }),

          client: tx,
        }),
      );
    } catch (error: unknown) {
      changedActorError = error;
    }

    assertErrorCode(
      changedActorError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * Durable state.
     */
    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: canonicalReceiptId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: canonicalReceiptId,
      },
    });

    const reportedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: canonicalReceiptId,

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(aggregateCount, 1);
    assert.equal(eventCount, 1);
    assert.equal(reportedEventCount, 1);
    assert.equal(receiptCount, 1);

    console.log(
      "✓ Idempotent Program Capital Receipt reporting smoke test passed",
    );

    console.log({
      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      receipt: {
        id: canonicalReceiptId,

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

        commandReceipts: receiptCount,
      },

      invariants: {
        digitalAssetReceiptCanBeReported: true,

        reportedReceiptStartsAtVersionOne: true,

        reportedReceiptRemainsUnverified: true,

        reportedReceiptRemainsUnrecognized: true,

        externalReferenceRetained: true,

        declaredUsdtAmountRetained: true,

        durableReloadReconstructsReceipt: true,

        firstReportCreatesOneAggregate: true,

        firstReportCreatesOneEvent: true,

        firstReportCreatesOneCommandReceipt: true,

        exactRetryReplayed: true,

        exactRetryReturnsOriginalCanonicalReceiptIdentity: true,

        exactRetryCreatesNoDuplicateAggregate: true,

        exactRetryAppendsNoDuplicateEvent: true,

        changedAmountWithSameKeyRejected: true,

        changedExternalReferenceWithSameKeyRejected: true,

        changedActorWithSameKeyRejected: true,

        reportingDoesNotVerifyCapital: true,

        reportingDoesNotRecognizeCapital: true,
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
