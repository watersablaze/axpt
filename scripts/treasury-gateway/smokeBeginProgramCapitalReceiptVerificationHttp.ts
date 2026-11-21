import assert from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import type {
  Principal,
} from "../../src/domains/auth/types";

import {
  beginProgramCapitalReceiptVerificationHttp,
} from "../../src/domains/control-center/treasury/beginProgramCapitalReceiptVerificationHttp";

import {
  reportProgramCapitalReceiptIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/capital-receipts/application/reportProgramCapitalReceiptIdempotentlyWithClient";

import {
  CAPITAL_RECEIPT_METHOD,
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

const prisma =
  new PrismaClient();

function buildRequest(
  idempotencyKey?:
    string,
): Request {
  const headers =
    new Headers();

  if (
    idempotencyKey
  ) {
    headers.set(
      "Idempotency-Key",
      idempotencyKey,
    );
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/capital-receipts/example/verification/start",
    {
      method:
        "POST",

      headers,
    },
  );
}

function reportContext(
  fixtureId:
    string,
) {
  return {
    commandId:
      `trv-1e2a-report-command-${fixtureId}`,

    actorId:
      `trv-1e2a-report-actor-${fixtureId}`,

    correlationId:
      `trv-1e2a-report-correlation-${fixtureId}`,

    requestedAt:
      new Date(
        "2026-09-23T15:00:00.000Z",
      ),

    idempotencyKey:
      `trv-1e2a-report-key-${fixtureId}`,
  };
}

async function main():
  Promise<void> {
  const fixtureId =
    randomUUID();

  const receiptId =
    `trv-1e2a-receipt-${fixtureId}`;

  const missingReceiptId =
    `trv-1e2a-missing-${fixtureId}`;

  const idempotencyKey =
    `trv-1e2a-start-key-${fixtureId}`;

  const principal:
    Principal =
    {
      userId:
        `trv-1e2a-reviewer-${fixtureId}`,

      email:
        `trv-1e2a-${fixtureId}@example.test`,

      displayName:
        "TRV Begin Verification Reviewer",

      roles: [
        "TREASURY_OPERATOR",
      ],

      permissions: [
        "TREASURY_READ",
        "TREASURY_REVIEW",
      ],
    };

  try {
    /*
     * ====================================================
     * FIXTURE — canonical REPORTED receipt
     * ====================================================
     */

    await prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) => {
        await reportProgramCapitalReceiptIdempotentlyWithClient({
          request: {
            receiptId,

            reference:
              `TRV-1E2A-${fixtureId}`,

            eventId:
              `trv-1e2a-reported-event-${fixtureId}`,

            context:
              reportContext(
                fixtureId,
              ),

            payload: {
              programId:
                `program-${fixtureId}`,

              destinationProgramAccountId:
                `program-account-${fixtureId}`,

              declaredAmount: {
                amount:
                  "471812.40",

                currency:
                  "USDT",
              },

              receiptMethod:
                CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

              externalReference:
                `0x${fixtureId.replaceAll("-", "")}`,

              receivedAt:
                new Date(
                  "2026-09-23T14:59:00.000Z",
                ),
            },
          },

          client:
            tx,
        });
      },
    );

    /*
     * ====================================================
     * CASE 1 — missing idempotency key
     * ====================================================
     */

    const missingKey =
      await beginProgramCapitalReceiptVerificationHttp({
        rawReceiptId:
          receiptId,

        request:
          buildRequest(),

        principal,

        prisma,
      });

    assert.equal(
      missingKey.status,
      400,
    );

    assert.deepEqual(
      missingKey.body,
      {
        ok:
          false,

        error:
          "IDEMPOTENCY_KEY_REQUIRED",
      },
    );

    console.log(
      "TRV_BEGIN_HTTP_MISSING_IDEMPOTENCY_KEY_OK",
    );

    /*
     * ====================================================
     * CASE 2 — missing receipt
     * ====================================================
     */

    const missingReceipt =
      await beginProgramCapitalReceiptVerificationHttp({
        rawReceiptId:
          missingReceiptId,

        request:
          buildRequest(
            `missing-${fixtureId}`,
          ),

        principal,

        prisma,
      });

    assert.equal(
      missingReceipt.status,
      404,
    );

    assert.deepEqual(
      missingReceipt.body,
      {
        ok:
          false,

        error:
          "CAPITAL_RECEIPT_NOT_FOUND",
      },
    );

    console.log(
      "TRV_BEGIN_HTTP_MISSING_RECEIPT_NOT_FOUND_OK",
    );

    /*
     * ====================================================
     * CASE 3 — first start
     * ====================================================
     */

    const first =
      await beginProgramCapitalReceiptVerificationHttp({
        rawReceiptId:
          `  ${receiptId}  `,

        request:
          buildRequest(
            idempotencyKey,
          ),

        principal,

        prisma,

        generateIdentity:
          (() => {
            let n =
              0;

            return () =>
              `first-${fixtureId}-${++n}`;
          })(),

        now:
          () =>
            new Date(
              "2026-09-23T15:01:00.000Z",
            ),
      });

    assert.equal(
      first.status,
      200,
    );

    assert.equal(
      first.body.ok,
      true,
    );

    if (
      !first.body.ok
    ) {
      throw new Error(
        "TRV_BEGIN_HTTP_FIRST_EXPECTED_SUCCESS",
      );
    }

    assert.equal(
      first.body.disposition,
      "STARTED",
    );

    assert.equal(
      first.body.receipt.id,
      receiptId,
    );

    assert.equal(
      first.body.receipt.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      first.body.receipt.version,
      2,
    );

    console.log(
      "TRV_BEGIN_HTTP_FIRST_START_OK",
    );

    /*
     * ====================================================
     * CASE 4 — exact replay
     * ====================================================
     */

    const replay =
      await beginProgramCapitalReceiptVerificationHttp({
        rawReceiptId:
          receiptId,

        request:
          buildRequest(
            idempotencyKey,
          ),

        principal,

        prisma,

        generateIdentity:
          (() => {
            let n =
              0;

            return () =>
              `replay-${fixtureId}-${++n}`;
          })(),

        now:
          () =>
            new Date(
              "2026-09-23T15:02:00.000Z",
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

    if (
      !replay.body.ok
    ) {
      throw new Error(
        "TRV_BEGIN_HTTP_REPLAY_EXPECTED_SUCCESS",
      );
    }

    assert.equal(
      replay.body.disposition,
      "REPLAYED",
    );

    assert.equal(
      replay.body.receipt.version,
      2,
    );

    console.log(
      "TRV_BEGIN_HTTP_EXACT_REPLAY_OK",
    );

    /*
     * ====================================================
     * DURABILITY AFTER EXACT REPLAY
     * ====================================================
     */

    const [
      startedEventsAfterReplay,
      receiptAfterReplay,
    ] =
      await Promise.all([
        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
          },
        }),

        prisma.treasuryGatewayAggregate.findUniqueOrThrow({
          where: {
            aggregateType_aggregateId: {
              aggregateType:
                TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

              aggregateId:
                receiptId,
            },
          },
        }),
      ]);

    assert.equal(
      startedEventsAfterReplay,
      1,
    );

    assert.equal(
      receiptAfterReplay.version,
      2,
    );

    console.log(
      "TRV_BEGIN_HTTP_REPLAY_NO_SECOND_EVENT_OK",
    );

    console.log(
      "TRV_BEGIN_HTTP_REPLAY_NO_VERSION_ADVANCE_OK",
    );

    /*
     * ====================================================
     * CASE 5 — same key, different actor
     * ====================================================
     */

    const wrongActor:
      Principal =
      {
        ...principal,

        userId:
          `different-reviewer-${fixtureId}`,
      };

    const actorCollision =
      await beginProgramCapitalReceiptVerificationHttp({
        rawReceiptId:
          receiptId,

        request:
          buildRequest(
            idempotencyKey,
          ),

        principal:
          wrongActor,

        prisma,
      });

    assert.equal(
      actorCollision.status,
      409,
    );

    assert.deepEqual(
      actorCollision.body,
      {
        ok:
          false,

        error:
          "CAPITAL_RECEIPT_VERIFICATION_START_IDEMPOTENCY_COLLISION",
      },
    );

    console.log(
      "TRV_BEGIN_HTTP_ACTOR_COLLISION_OK",
    );

    /*
     * ====================================================
     * CASE 6 — new key after lifecycle already advanced
     * ====================================================
     */

    const repeatedStart =
      await beginProgramCapitalReceiptVerificationHttp({
        rawReceiptId:
          receiptId,

        request:
          buildRequest(
            `new-key-${fixtureId}`,
          ),

        principal,

        prisma,
      });

    assert.equal(
      repeatedStart.status,
      409,
    );

    assert.deepEqual(
      repeatedStart.body,
      {
        ok:
          false,

        error:
          "CAPITAL_RECEIPT_VERIFICATION_START_TRANSITION_INVALID",
      },
    );

    console.log(
      "TRV_BEGIN_HTTP_REPEAT_WITH_NEW_KEY_TRANSITION_REJECTED_OK",
    );

    /*
     * ====================================================
     * FINAL DURABLE STATE
     * ====================================================
     */

    const [
      finalAggregate,
      finalStartEventCount,
      evidenceEventCount,
      verifiedEventCount,
      recognizedEventCount,
      commandReceipts,
    ] =
      await Promise.all([
        prisma.treasuryGatewayAggregate.findUniqueOrThrow({
          where: {
            aggregateType_aggregateId: {
              aggregateType:
                TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

              aggregateId:
                receiptId,
            },
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
          },
        }),

        prisma.treasuryGatewayEvent.count({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,

            eventType:
              TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,
          },
        }),

        prisma.treasuryGatewayCommandReceipt.findMany({
          where: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

            aggregateId:
              receiptId,
          },
        }),
      ]);

    assert.equal(
      finalAggregate.status,
      PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION,
    );

    assert.equal(
      finalAggregate.version,
      2,
    );

    assert.equal(
      finalStartEventCount,
      1,
    );

    assert.equal(
      evidenceEventCount,
      0,
    );

    assert.equal(
      verifiedEventCount,
      0,
    );

    assert.equal(
      recognizedEventCount,
      0,
    );

    const beginReceipts =
      commandReceipts.filter(
        (
          receipt:
            (typeof commandReceipts)[number],
        ) =>
          receipt.commandKind ===
          "BEGIN_PROGRAM_CAPITAL_RECEIPT_VERIFICATION",
      );

    assert.equal(
      beginReceipts.length,
      1,
    );

    assert.equal(
      beginReceipts[0]?.actorId,
      principal.userId,
    );

    console.log(
      "TRV_BEGIN_HTTP_EXACTLY_ONE_START_EVENT_OK",
    );

    console.log(
      "TRV_BEGIN_HTTP_EXACTLY_ONE_COMMAND_RECEIPT_OK",
    );

    console.log(
      "TRV_BEGIN_HTTP_STOPS_AT_UNDER_VERIFICATION_OK",
    );

    console.log(
      "TRV_BEGIN_HTTP_DOES_NOT_ADMIT_EVIDENCE_OK",
    );

    console.log(
      "TRV_BEGIN_HTTP_DOES_NOT_VERIFY_RECEIPT_OK",
    );

    console.log(
      "TRV_BEGIN_HTTP_DOES_NOT_RECOGNIZE_CAPITAL_OK",
    );
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        aggregateId: {
          in: [
            receiptId,
            missingReceiptId,
          ],
        },
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: {
          in: [
            receiptId,
            missingReceiptId,
          ],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: {
          in: [
            receiptId,
            missingReceiptId,
          ],
        },
      },
    });
  }
}

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
      await prisma.$disconnect();
    },
  );
