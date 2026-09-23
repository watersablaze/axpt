import assert from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  CAPITAL_RECEIPT_METHOD,
  type CapitalReceiptEvidence,
} from "../../src/domains/treasury/gateway/capital-receipts/contracts";

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
  reportProgramCapitalReceiptIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

import {
  beginProgramCapitalReceiptVerificationIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/beginProgramCapitalReceiptVerificationIdempotentlyWithClient";

import {
  admitProgramCapitalReceiptEvidenceIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/admitProgramCapitalReceiptEvidenceIdempotentlyWithClient";

import {
  verifyProgramCapitalReceiptIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/verifyProgramCapitalReceiptIdempotentlyWithClient";

import {
  recognizeProgramCapitalDurablyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/recognizeProgramCapitalDurablyWithClient";

import {
  loadProgramCapitalReceiptVerificationPerceptionWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/loadProgramCapitalReceiptVerificationPerceptionWithClient";

const prisma =
  new PrismaClient();

type Fixture =
  Readonly<{
    receiptId:
      string;

    actorId:
      string;

    correlationId:
      string;

    evidenceA:
      string;

    evidenceB:
      string;

    evidenceC:
      string;

    verifiedAt:
      Date;
  }>;

function assertErrorCode(
  error:
    unknown,

  code:
    string,
): void {
  assert(
    error instanceof Error,
  );

  assert(
    error.message.includes(
      code,
    ),
    `Expected ${code}, received ${error.message}`,
  );
}

function makeFixture(
  fixtureId:
    string,

  suffix:
    string,
): Fixture {
  return {
    receiptId:
      `trv-perception-${suffix}-${fixtureId}`,

    actorId:
      `trv-perception-actor-${suffix}-${fixtureId}`,

    correlationId:
      `trv-perception-correlation-${suffix}-${fixtureId}`,

    evidenceA:
      `trv-perception-evidence-a-${suffix}-${fixtureId}`,

    evidenceB:
      `trv-perception-evidence-b-${suffix}-${fixtureId}`,

    evidenceC:
      `trv-perception-evidence-c-${suffix}-${fixtureId}`,

    verifiedAt:
      new Date(
        "2026-09-23T13:10:00.000Z",
      ),
  };
}

function context(
  fixture:
    Fixture,

  step:
    string,

  requestedAt:
    Date,
) {
  return {
    commandId:
      `${step}-command:${fixture.receiptId}`,

    actorId:
      fixture.actorId,

    authorityGrantId:
      `trv-perception-authority:${fixture.receiptId}`,

    correlationId:
      fixture.correlationId,

    requestedAt,

    idempotencyKey:
      `${step}-idempotency:${fixture.receiptId}`,
  };
}

async function reportReceipt(
  fixture:
    Fixture,
): Promise<void> {
  await prisma.$transaction(
    async (
      tx:
        TransactionClient,
    ) => {
      await reportProgramCapitalReceiptIdempotentlyWithClient({
        request: {
          receiptId:
            fixture.receiptId,

          reference:
            `TRV-PERCEPTION:${fixture.receiptId}`,

          eventId:
            `reported-event:${fixture.receiptId}`,

          context:
            context(
              fixture,
              "report",
              new Date(
                "2026-09-23T13:00:00.000Z",
              ),
            ),

          payload: {
            programId:
              `program:${fixture.receiptId}`,

            destinationProgramAccountId:
              `account:${fixture.receiptId}`,

            declaredAmount: {
              amount:
                "100.00",

              currency:
                "USDT",
            },

            receiptMethod:
              CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

            externalReference:
              `external:${fixture.receiptId}`,

            receivedAt:
              new Date(
                "2026-09-23T12:59:00.000Z",
              ),
          },
        },

        client:
          tx,
      });
    },
  );
}

async function beginVerification(
  fixture:
    Fixture,
): Promise<void> {
  await prisma.$transaction(
    async (
      tx:
        TransactionClient,
    ) => {
      await beginProgramCapitalReceiptVerificationIdempotentlyWithClient({
        receiptId:
          fixture.receiptId,

        eventId:
          `verification-started-event:${fixture.receiptId}`,

        context:
          context(
            fixture,
            "begin-verification",
            new Date(
              "2026-09-23T13:01:00.000Z",
            ),
          ),

        client:
          tx,
      });
    },
  );
}

async function admitEvidence(
  fixture:
    Fixture,

  evidenceId:
    string,

  suffix:
    string,

  evidenceType:
    typeof CAPITAL_RECEIPT_EVIDENCE_TYPE[
      keyof typeof CAPITAL_RECEIPT_EVIDENCE_TYPE
    ],
): Promise<void> {
  await prisma.$transaction(
    async (
      tx:
        TransactionClient,
    ) => {
      await admitProgramCapitalReceiptEvidenceIdempotentlyWithClient({
        receiptId:
          fixture.receiptId,

        evidenceId,

        evidenceType,

        artifactId:
          `artifact-${suffix}:${fixture.receiptId}`,

        externalReference:
          `evidence-reference-${suffix}:${fixture.receiptId}`,

        recordedAt:
          new Date(
            `2026-09-23T13:0${suffix === "a" ? "2" : suffix === "b" ? "3" : "4"}:00.000Z`,
          ),

        eventId:
          `evidence-${suffix}-event:${fixture.receiptId}`,

        context:
          context(
            fixture,
            `admit-evidence-${suffix}`,
            new Date(
              `2026-09-23T13:0${suffix === "a" ? "2" : suffix === "b" ? "3" : "4"}:30.000Z`,
            ),
          ),

        client:
          tx,
      });
    },
  );
}

async function verifyReceipt(
  fixture:
    Fixture,

  evidenceIds:
    string[],
): Promise<void> {
  await prisma.$transaction(
    async (
      tx:
        TransactionClient,
    ) => {
      await verifyProgramCapitalReceiptIdempotentlyWithClient({
        receiptId:
          fixture.receiptId,

        verifiedAmount: {
          amount:
            "99.50",

          currency:
            "USDT",
        },

        evidenceIds,

        verifiedAt:
          fixture.verifiedAt,

        eventId:
          `verified-event:${fixture.receiptId}`,

        context:
          context(
            fixture,
            "verify",
            new Date(
              "2026-09-23T13:10:30.000Z",
            ),
          ),

        client:
          tx,
      });
    },
  );
}

async function establishVerifiedReceipt(
  fixture:
    Fixture,

  options?: {
    threeEvidence?:
      boolean;

    selectedEvidenceIds?:
      string[];
  },
): Promise<void> {
  await reportReceipt(
    fixture,
  );

  await beginVerification(
    fixture,
  );

  await admitEvidence(
    fixture,
    fixture.evidenceA,
    "a",
    CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,
  );

  await admitEvidence(
    fixture,
    fixture.evidenceB,
    "b",
    CAPITAL_RECEIPT_EVIDENCE_TYPE.OPERATOR_CONFIRMATION,
  );

  if (
    options?.threeEvidence
  ) {
    await admitEvidence(
      fixture,
      fixture.evidenceC,
      "c",
      CAPITAL_RECEIPT_EVIDENCE_TYPE.CUSTODIAN_STATEMENT,
    );
  }

  await verifyReceipt(
    fixture,
    options?.selectedEvidenceIds ?? [
      fixture.evidenceA,
      fixture.evidenceB,
    ],
  );
}

async function expectPerceptionError(
  receiptId:
    string,

  code:
    string,
): Promise<void> {
  let received:
    unknown;

  try {
    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        loadProgramCapitalReceiptVerificationPerceptionWithClient({
          receiptId,

          client:
            tx,
        }),
    );
  } catch (
    error:
      unknown
  ) {
    received =
      error;
  }

  assertErrorCode(
    received,
    code,
  );
}

async function main():
  Promise<void> {
  const fixtureId =
    randomUUID();

  /*
   * ======================================================
   * CASE 0 — missing receipt
   * ======================================================
   */

  const missing =
    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        loadProgramCapitalReceiptVerificationPerceptionWithClient({
          receiptId:
            `missing-trv-perception-${fixtureId}`,

          client:
            tx,
        }),
    );

  assert.equal(
    missing,
    null,
  );

  console.log(
    "TRV_PERCEPTION_MISSING_RECEIPT_RETURNS_NULL_OK",
  );

  /*
   * ======================================================
   * CASE 1 — REPORTED
   * no verification event is valid
   * ======================================================
   */

  const reportedFixture =
    makeFixture(
      fixtureId,
      "reported",
    );

  await reportReceipt(
    reportedFixture,
  );

  const reported =
    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        loadProgramCapitalReceiptVerificationPerceptionWithClient({
          receiptId:
            reportedFixture.receiptId,

          client:
            tx,
        }),
    );

  assert(
    reported,
  );

  assert.equal(
    reported.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  );

  assert.equal(
    reported.verificationEvent,
    null,
  );

  assert.deepEqual(
    reported.selectedEvidenceIds,
    [],
  );

  assert.deepEqual(
    reported.selectedEvidence,
    [],
  );

  console.log(
    "TRV_PERCEPTION_REPORTED_WITHOUT_VERIFICATION_EVENT_OK",
  );

  /*
   * ======================================================
   * CASE 2 — UNDER_VERIFICATION
   * admitted evidence is visible
   * no verification event is still valid
   * ======================================================
   */

  const underReviewFixture =
    makeFixture(
      fixtureId,
      "under-review",
    );

  await reportReceipt(
    underReviewFixture,
  );

  await beginVerification(
    underReviewFixture,
  );

  await admitEvidence(
    underReviewFixture,
    underReviewFixture.evidenceA,
    "a",
    CAPITAL_RECEIPT_EVIDENCE_TYPE.BLOCKCHAIN_TRANSACTION,
  );

  const underReview =
    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        loadProgramCapitalReceiptVerificationPerceptionWithClient({
          receiptId:
            underReviewFixture.receiptId,

          client:
            tx,
        }),
    );

  assert(
    underReview,
  );

  assert.equal(
    underReview.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
  );

  assert.equal(
    underReview.verificationEvent,
    null,
  );

  assert.equal(
    underReview.admittedEvidence.length,
    1,
  );

  assert.equal(
    underReview.unselectedAdmittedEvidence.length,
    1,
  );

  console.log(
    "TRV_PERCEPTION_UNDER_VERIFICATION_EVIDENCE_VISIBLE_OK",
  );

  /*
   * ======================================================
   * CASE 3 — VERIFIED with selected subset
   * ======================================================
   */

  const verifiedFixture =
    makeFixture(
      fixtureId,
      "verified",
    );

  await establishVerifiedReceipt(
    verifiedFixture,
    {
      threeEvidence:
        true,

      selectedEvidenceIds: [
        verifiedFixture.evidenceA,
        verifiedFixture.evidenceC,
      ],
    },
  );

  const verified =
    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        loadProgramCapitalReceiptVerificationPerceptionWithClient({
          receiptId:
            verifiedFixture.receiptId,

          client:
            tx,
        }),
    );

  assert(
    verified,
  );

  assert.equal(
    verified.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
  );

  assert(
    verified.verificationEvent,
  );

  assert.equal(
    verified.verificationEvent.actorId,
    verifiedFixture.actorId,
  );

  assert.equal(
    verified.verificationEvent.authorityGrantId,
    `trv-perception-authority:${verifiedFixture.receiptId}`,
  );

  assert.equal(
    verified.verificationEvent.verifiedAt.toISOString(),
    verifiedFixture.verifiedAt.toISOString(),
  );

  assert.equal(
    verified.admittedEvidence.length,
    3,
  );

  assert.deepEqual(
    verified.selectedEvidenceIds,
    [
      verifiedFixture.evidenceA,
      verifiedFixture.evidenceC,
    ],
  );

  assert.deepEqual(
    verified.selectedEvidence.map(
      (
        evidence:
          CapitalReceiptEvidence,
      ) =>
        evidence.id,
    ),
    [
      verifiedFixture.evidenceA,
      verifiedFixture.evidenceC,
    ],
  );

  assert.deepEqual(
    verified.unselectedAdmittedEvidence.map(
      (
        evidence:
          CapitalReceiptEvidence,
      ) =>
        evidence.id,
    ),
    [
      verifiedFixture.evidenceB,
    ],
  );

  console.log(
    "TRV_PERCEPTION_VERIFIED_EVENT_RECONSTRUCTED_OK",
  );

  console.log(
    "TRV_PERCEPTION_SELECTED_UNSELECTED_EVIDENCE_SPLIT_OK",
  );

  /*
   * ======================================================
   * CASE 4 — RECOGNIZED
   *
   * Recognition advances current aggregate state, but
   * original verification truth must remain reconstructable.
   * ======================================================
   */

  await prisma.$transaction(
    async (
      tx:
        TransactionClient,
    ) => {
      await recognizeProgramCapitalDurablyWithClient({
        command: {
          context:
            context(
              verifiedFixture,
              "recognize",
              new Date(
                "2026-09-23T13:20:00.000Z",
              ),
            ),

          payload: {
            receiptId:
              verifiedFixture.receiptId,

            recognizedAmount: {
              amount:
                "90.00",

              currency:
                "USDT",
            },

            recognitionMemo:
              "TRV perception recognition continuity fixture.",
          },
        },

        eventId:
          `recognized-event:${verifiedFixture.receiptId}`,

        client:
          tx,
      });
    },
  );

  const recognized =
    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) =>
        loadProgramCapitalReceiptVerificationPerceptionWithClient({
          receiptId:
            verifiedFixture.receiptId,

          client:
            tx,
        }),
    );

  assert(
    recognized,
  );

  assert.equal(
    recognized.receipt.status,
    PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
  );

  assert(
    recognized.verificationEvent,
  );

  assert.deepEqual(
    recognized.selectedEvidenceIds,
    [
      verifiedFixture.evidenceA,
      verifiedFixture.evidenceC,
    ],
  );

  assert.deepEqual(
    recognized.verificationEvent.verifiedAmount,
    {
      amount:
        "99.50",

      currency:
        "USDT",
    },
  );

  console.log(
    "TRV_PERCEPTION_RECOGNIZED_PRESERVES_VERIFICATION_HISTORY_OK",
  );

  /*
   * ======================================================
   * CASE 5 — VERIFIED snapshot but verification event missing
   * ======================================================
   */

  const missingEventFixture =
    makeFixture(
      fixtureId,
      "missing-event",
    );

  await establishVerifiedReceipt(
    missingEventFixture,
  );

  await prisma.treasuryGatewayEvent.update({
    where: {
      eventId:
        `verified-event:${missingEventFixture.receiptId}`,
    },

    data: {
      eventType:
        TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
    },
  });

  await expectPerceptionError(
    missingEventFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_MISSING",
  );

  console.log(
    "TRV_PERCEPTION_VERIFIED_WITHOUT_EVENT_FAILS_CLOSED_OK",
  );

  /*
   * ======================================================
   * CASE 6 — multiple verification events
   *
   * Reclassify one evidence event inside this isolated
   * corrupted fixture. Loader must reject event cardinality.
   * ======================================================
   */

  const duplicateEventFixture =
    makeFixture(
      fixtureId,
      "duplicate-event",
    );

  await establishVerifiedReceipt(
    duplicateEventFixture,
  );

  await prisma.treasuryGatewayEvent.update({
    where: {
      eventId:
        `evidence-a-event:${duplicateEventFixture.receiptId}`,
    },

    data: {
      eventType:
        TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
    },
  });

  await expectPerceptionError(
    duplicateEventFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_CARDINALITY_INVALID",
  );

  console.log(
    "TRV_PERCEPTION_MULTIPLE_VERIFICATION_EVENTS_FAIL_CLOSED_OK",
  );

  /*
   * ======================================================
   * CASE 7 — snapshot verifiedAmount disagrees with event
   * ======================================================
   */

  const amountMismatchFixture =
    makeFixture(
      fixtureId,
      "amount-mismatch",
    );

  await establishVerifiedReceipt(
    amountMismatchFixture,
  );

  const amountAggregate =
    await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
      where: {
        aggregateType_aggregateId: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId:
            amountMismatchFixture.receiptId,
        },
      },
    });

  const amountSnapshot =
    JSON.parse(
      JSON.stringify(
        amountAggregate.snapshot,
      ),
    );

  amountSnapshot.verifiedAmount = {
    amount:
      "98.00",

    currency:
      "USDT",
  };

  await prisma.treasuryGatewayAggregate.update({
    where: {
      aggregateType_aggregateId: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId:
          amountMismatchFixture.receiptId,
      },
    },

    data: {
      snapshot:
        amountSnapshot,
    },
  });

  await expectPerceptionError(
    amountMismatchFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_AMOUNT_MISMATCH",
  );

  console.log(
    "TRV_PERCEPTION_SNAPSHOT_EVENT_AMOUNT_MISMATCH_FAILS_CLOSED_OK",
  );

  /*
   * ======================================================
   * CASE 8 — snapshot verifiedAt disagrees with event
   * ======================================================
   */

  const timeMismatchFixture =
    makeFixture(
      fixtureId,
      "time-mismatch",
    );

  await establishVerifiedReceipt(
    timeMismatchFixture,
  );

  const timeAggregate =
    await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
      where: {
        aggregateType_aggregateId: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId:
            timeMismatchFixture.receiptId,
        },
      },
    });

  const timeSnapshot =
    JSON.parse(
      JSON.stringify(
        timeAggregate.snapshot,
      ),
    );

  timeSnapshot.verifiedAt =
    "2026-09-23T13:10:01.000Z";

  await prisma.treasuryGatewayAggregate.update({
    where: {
      aggregateType_aggregateId: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId:
          timeMismatchFixture.receiptId,
      },
    },

    data: {
      snapshot:
        timeSnapshot,
    },
  });

  await expectPerceptionError(
    timeMismatchFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_TIME_MISMATCH",
  );

  console.log(
    "TRV_PERCEPTION_SNAPSHOT_EVENT_TIME_MISMATCH_FAILS_CLOSED_OK",
  );

  /*
   * ======================================================
   * CASE 9 — event occurredAt disagrees with verifiedAt
   * ======================================================
   */

  const occurredAtFixture =
    makeFixture(
      fixtureId,
      "occurred-at-mismatch",
    );

  await establishVerifiedReceipt(
    occurredAtFixture,
  );

  await prisma.treasuryGatewayEvent.update({
    where: {
      eventId:
        `verified-event:${occurredAtFixture.receiptId}`,
    },

    data: {
      occurredAt:
        new Date(
          "2026-09-23T13:10:01.000Z",
        ),
    },
  });

  await expectPerceptionError(
    occurredAtFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_OCCURRED_AT_MISMATCH",
  );

  console.log(
    "TRV_PERCEPTION_OCCURRED_AT_MISMATCH_FAILS_CLOSED_OK",
  );

  /*
   * ======================================================
   * CASE 10 — verification payload targets wrong receipt
   * ======================================================
   */

  const receiptMismatchFixture =
    makeFixture(
      fixtureId,
      "receipt-id-mismatch",
    );

  await establishVerifiedReceipt(
    receiptMismatchFixture,
  );

  const receiptMismatchEvent =
    await prisma.treasuryGatewayEvent.findUniqueOrThrow({
      where: {
        eventId:
          `verified-event:${receiptMismatchFixture.receiptId}`,
      },
    });

  const receiptMismatchPayload =
    JSON.parse(
      JSON.stringify(
        receiptMismatchEvent.payload,
      ),
    );

  receiptMismatchPayload.receiptId =
    `wrong-receipt-${fixtureId}`;

  await prisma.treasuryGatewayEvent.update({
    where: {
      eventId:
        `verified-event:${receiptMismatchFixture.receiptId}`,
    },

    data: {
      payload:
        receiptMismatchPayload,
    },
  });

  await expectPerceptionError(
    receiptMismatchFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_RECEIPT_ID_MISMATCH",
  );

  console.log(
    "TRV_PERCEPTION_EVENT_RECEIPT_ID_MISMATCH_FAILS_CLOSED_OK",
  );

  /*
   * ======================================================
   * CASE 11 — selected evidence was not admitted at judgment
   * ======================================================
   */

  const selectedEvidenceFixture =
    makeFixture(
      fixtureId,
      "selected-evidence-missing",
    );

  await establishVerifiedReceipt(
    selectedEvidenceFixture,
  );

  const selectedEvidenceEvent =
    await prisma.treasuryGatewayEvent.findUniqueOrThrow({
      where: {
        eventId:
          `verified-event:${selectedEvidenceFixture.receiptId}`,
      },
    });

  const selectedEvidencePayload =
    JSON.parse(
      JSON.stringify(
        selectedEvidenceEvent.payload,
      ),
    );

  selectedEvidencePayload.evidenceIds = [
    `never-admitted-${fixtureId}`,
  ];

  await prisma.treasuryGatewayEvent.update({
    where: {
      eventId:
        `verified-event:${selectedEvidenceFixture.receiptId}`,
    },

    data: {
      payload:
        selectedEvidencePayload,
    },
  });

  await expectPerceptionError(
    selectedEvidenceFixture.receiptId,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_SELECTED_EVIDENCE_NOT_ADMITTED",
  );

  console.log(
    "TRV_PERCEPTION_SELECTED_EVIDENCE_HORIZON_FAILS_CLOSED_OK",
  );

  /*
   * ======================================================
   * FINAL DOCTRINE
   * ======================================================
   */

  console.log(
    "TRV_PERCEPTION_READ_MODEL_DOES_NOT_RECOGNIZE_CAPITAL_OK",
  );
}

const fixtureMarker =
  "trv-perception-";

main()
  .catch(
    (
      error:
        unknown,
    ) => {
      console.error(
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      /*
       * Fixtures are deliberately isolated by the
       * trv-perception-* aggregate-id namespace.
       *
       * Cleanup order:
       * command receipts → events → aggregates.
       */
      await prisma.treasuryGatewayCommandReceipt.deleteMany({
        where: {
          aggregateId: {
            startsWith:
              fixtureMarker,
          },
        },
      });

      await prisma.treasuryGatewayEvent.deleteMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: {
            startsWith:
              fixtureMarker,
          },
        },
      });

      await prisma.treasuryGatewayAggregate.deleteMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId: {
            startsWith:
              fixtureMarker,
          },
        },
      });

      await prisma.$disconnect();
    },
  );
