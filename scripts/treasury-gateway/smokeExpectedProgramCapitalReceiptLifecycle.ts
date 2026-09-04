import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PrismaClient, type TransactionClient } from "@prisma/client";

import { CAPITAL_RECEIPT_METHOD } from "../../src/domains/treasury/gateway/capital-receipts/contracts";
import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../../src/domains/treasury/gateway/capital-receipts/status";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { registerExpectedProgramCapitalReceiptDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/registerExpectedProgramCapitalReceiptDurablyWithClient";
import { reportExpectedProgramCapitalReceiptDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/reportExpectedProgramCapitalReceiptDurablyWithClient";
import { beginProgramCapitalReceiptVerificationDurablyWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationDurablyWithClient";
import { loadProgramCapitalReceiptWithClient } from "../../src/domains/treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

const prisma = new PrismaClient();

function context(step: string, requestedAt: Date, fixtureId: string) {
  return {
    commandId: `expected-capital-receipt-${step}-command-${fixtureId}`,
    actorId: `expected-capital-receipt-operator-${fixtureId}`,
    correlationId: `expected-capital-receipt-correlation-${fixtureId}`,
    requestedAt,
    idempotencyKey: `expected-capital-receipt-${step}-idempotency-${fixtureId}`,
  };
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const receiptId = `expected-capital-receipt-${fixtureId}`;

  const expectedAt = new Date("2026-09-04T12:00:00.000Z");

  const receivedAt = new Date("2026-09-04T12:04:00.000Z");

  const transactionHash = `0x${fixtureId.replaceAll("-", "")}`;

  /*
   * v1 — Treasury records an expectation.
   *
   * This is governed knowledge of anticipated capital,
   * not an assertion that capital has arrived.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await registerExpectedProgramCapitalReceiptDurablyWithClient({
      receiptId,

      reference: `DONGIN-USDT-EXPECTED-${fixtureId}`,

      command: {
        context: context(
          "register",
          new Date("2026-09-04T11:00:00.000Z"),
          fixtureId,
        ),

        payload: {
          programId: `program-${fixtureId}`,

          destinationProgramAccountId: `program-account-${fixtureId}`,

          receivedFromPartyId: `dongin-${fixtureId}`,

          declaredAmount: {
            amount: "600000.00",
            currency: "USDT",
          },

          receiptMethod: CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

          expectedAt,
        },
      },

      eventId: `capital-receipt-expected-event-${fixtureId}`,

      client: tx,
    });
  });

  const expected = await prisma.$transaction(async (tx: TransactionClient) =>
    loadProgramCapitalReceiptWithClient({
      receiptId,
      client: tx,
    }),
  );

  assert.ok(expected);

  assert.equal(
    expected.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.EXPECTED,
  );

  assert.equal(expected.aggregate.metadata.version, 1);

  assert.deepEqual(expected.aggregate.declaredAmount, {
    amount: "600000.00",
    currency: "USDT",
  });

  assert.equal(
    expected.aggregate.expectedAt?.toISOString(),
    expectedAt.toISOString(),
  );

  assert.equal(expected.aggregate.receivedAt, undefined);

  assert.equal(expected.aggregate.externalReference, undefined);

  assert.equal(expected.aggregate.verifiedAmount, undefined);

  assert.equal(expected.aggregate.recognizedAmount, undefined);

  /*
   * An expectation cannot enter verification before
   * external receipt observation has been reported.
   */
  let prematureVerificationRejected = false;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await beginProgramCapitalReceiptVerificationDurablyWithClient({
        receiptId,

        eventId: `premature-verification-event-${fixtureId}`,

        context: context(
          "premature-verification",
          new Date("2026-09-04T11:30:00.000Z"),
          fixtureId,
        ),

        client: tx,
      });
    });
  } catch (error) {
    assert.ok(error instanceof Error);

    assert.match(
      error.message,
      /\[PROGRAM_CAPITAL_RECEIPT_TRANSITION_INVALID\]/,
    );

    prematureVerificationRejected = true;
  }

  assert.equal(prematureVerificationRejected, true);

  const afterPrematureVerification = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(afterPrematureVerification);

  assert.equal(
    afterPrematureVerification.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.EXPECTED,
  );

  assert.equal(afterPrematureVerification.aggregate.metadata.version, 1);

  const eventsBeforeReporting = await prisma.treasuryGatewayEvent.count({
    where: {
      aggregateId: receiptId,
    },
  });

  assert.equal(eventsBeforeReporting, 1);

  /*
   * v2 — external reality appears.
   *
   * The existing EXPECTED receipt advances to REPORTED.
   * No second Capital Receipt aggregate is created.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await reportExpectedProgramCapitalReceiptDurablyWithClient({
      command: {
        context: context(
          "report",
          new Date("2026-09-04T12:05:00.000Z"),
          fixtureId,
        ),

        payload: {
          receiptId,

          externalReference: transactionHash,

          receivedAt,
        },
      },

      eventId: `capital-receipt-reported-event-${fixtureId}`,

      client: tx,
    });
  });

  const reported = await prisma.$transaction(async (tx: TransactionClient) =>
    loadProgramCapitalReceiptWithClient({
      receiptId,
      client: tx,
    }),
  );

  assert.ok(reported);

  assert.equal(
    reported.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(reported.aggregate.metadata.version, 2);

  assert.deepEqual(reported.aggregate.declaredAmount, {
    amount: "600000.00",
    currency: "USDT",
  });

  assert.equal(
    reported.aggregate.expectedAt?.toISOString(),
    expectedAt.toISOString(),
  );

  assert.equal(
    reported.aggregate.receivedAt?.toISOString(),
    receivedAt.toISOString(),
  );

  assert.equal(reported.aggregate.externalReference, transactionHash);

  assert.equal(reported.aggregate.verifiedAmount, undefined);

  assert.equal(reported.aggregate.recognizedAmount, undefined);

  /*
   * v3 — after reporting, the normal verification
   * lifecycle becomes available.
   */
  await prisma.$transaction(async (tx: TransactionClient) => {
    await beginProgramCapitalReceiptVerificationDurablyWithClient({
      receiptId,

      eventId: `capital-receipt-verification-started-event-${fixtureId}`,

      context: context(
        "begin-verification",
        new Date("2026-09-04T12:06:00.000Z"),
        fixtureId,
      ),

      client: tx,
    });
  });

  const underVerification = await prisma.$transaction(
    async (tx: TransactionClient) =>
      loadProgramCapitalReceiptWithClient({
        receiptId,
        client: tx,
      }),
  );

  assert.ok(underVerification);

  assert.equal(
    underVerification.aggregate.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
  );

  assert.equal(underVerification.aggregate.metadata.version, 3);

  assert.deepEqual(underVerification.aggregate.declaredAmount, {
    amount: "600000.00",
    currency: "USDT",
  });

  assert.equal(
    underVerification.aggregate.expectedAt?.toISOString(),
    expectedAt.toISOString(),
  );

  assert.equal(
    underVerification.aggregate.receivedAt?.toISOString(),
    receivedAt.toISOString(),
  );

  assert.equal(underVerification.aggregate.externalReference, transactionHash);

  /*
   * Durable history must describe one aggregate
   * advancing through three distinct facts.
   */
  const [
    aggregateCount,
    eventCount,
    expectedEvents,
    reportedEvents,
    verificationStartedEvents,
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

        eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EXPECTED,
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
  ]);

  assert.equal(aggregateCount, 1);

  assert.equal(eventCount, 3);

  assert.equal(expectedEvents, 1);

  assert.equal(reportedEvents, 1);

  assert.equal(verificationStartedEvents, 1);

  console.log("✓ Expected Program Capital Receipt lifecycle smoke test passed");

  console.dir(
    {
      receipt: {
        id: underVerification.aggregate.id,
        status: underVerification.aggregate.status,
        version: underVerification.aggregate.metadata.version,

        declaredAmount: underVerification.aggregate.declaredAmount,

        expectedAt: underVerification.aggregate.expectedAt,

        receivedAt: underVerification.aggregate.receivedAt,

        externalReference: underVerification.aggregate.externalReference,
      },

      durableState: {
        aggregates: aggregateCount,
        events: eventCount,
        expectedEvents,
        reportedEvents,
        verificationStartedEvents,
      },

      invariants: {
        expectationBeginsAtVersionOne:
          expected.aggregate.metadata.version === 1,

        expectationDoesNotClaimReceipt:
          expected.aggregate.receivedAt === undefined &&
          expected.aggregate.externalReference === undefined,

        prematureVerificationRejected,

        prematureVerificationPreservesExpectedState:
          afterPrematureVerification.aggregate.status ===
            PROGRAM_CAPITAL_RECEIPT_STATUS.EXPECTED &&
          afterPrematureVerification.aggregate.metadata.version === 1,

        prematureVerificationAppendsNoEvent: eventsBeforeReporting === 1,

        reportingAdvancesSameAggregate:
          aggregateCount === 1 && reported.aggregate.metadata.version === 2,

        reportingPreservesDeclaredAmount:
          reported.aggregate.declaredAmount.amount === "600000.00" &&
          reported.aggregate.declaredAmount.currency === "USDT",

        reportingPreservesExpectation:
          reported.aggregate.expectedAt?.toISOString() ===
          expectedAt.toISOString(),

        reportingEstablishesObservedReality:
          reported.aggregate.receivedAt?.toISOString() ===
            receivedAt.toISOString() &&
          reported.aggregate.externalReference === transactionHash,

        reportedReceiptCanEnterVerification:
          underVerification.aggregate.status ===
            PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION &&
          underVerification.aggregate.metadata.version === 3,

        expectedReceiptProducesExactlyOneExpectedEvent: expectedEvents === 1,

        observationProducesExactlyOneReportedEvent: reportedEvents === 1,
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
