import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";

import { beginTreasuryTransferAuthorityReviewHttp } from "../../src/domains/control-center/treasury/beginTreasuryTransferAuthorityReviewHttp";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function buildRequest(idempotencyKey?: string): Request {
  const headers = new Headers();

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers/example/authority-review",
    {
      method: "POST",

      headers,
    },
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-control-center-review-${fixtureId}`;

  const missingTransferId = `smoke-control-center-review-missing-${fixtureId}`;

  const idempotencyKey = `smoke-control-center-review-key-${fixtureId}`;

  const principal: Principal = {
    userId: `smoke-control-center-review-operator-${fixtureId}`,

    email: `review-${fixtureId}@example.test`,

    displayName: "Treasury Review Smoke Operator",

    roles: ["TREASURY_OPERATOR"],

    permissions: ["TREASURY_READ", "TREASURY_REVIEW"],
  };

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferDurablyWithClient({
        request: {
          transferId,

          reference: `AXPT-CONTROL-CENTER-REVIEW-${fixtureId}`,

          eventId: `smoke-control-center-review-created-event-${fixtureId}`,

          context: {
            commandId: `smoke-control-center-review-create-command-${fixtureId}`,

            actorId: principal.userId,

            correlationId: `smoke-control-center-review-create-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `smoke-control-center-review-create-${fixtureId}`,
          },

          payload: {
            programId: `smoke-control-center-review-program-${fixtureId}`,

            source: {
              kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

              programAccountId: `smoke-control-center-review-account-${fixtureId}`,
            },

            destination: {
              kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

              settlementEndpointId: `smoke-control-center-review-endpoint-${fixtureId}`,
            },

            requestedAmount: {
              amount: "225000.00",

              currency: "USD",
            },

            destinationCurrency: "USD",

            purpose: "Control Center authority review HTTP smoke",
          },
        },

        client: tx,
      }),
    );

    const missingKey = await beginTreasuryTransferAuthorityReviewHttp({
      rawTransferId: transferId,

      request: buildRequest(),

      principal,

      prisma,
    });

    assert.equal(missingKey.status, 400);

    assert.deepEqual(missingKey.body, {
      ok: false,

      error: "IDEMPOTENCY_KEY_REQUIRED",
    });

    const missingTransfer = await beginTreasuryTransferAuthorityReviewHttp({
      rawTransferId: missingTransferId,

      request: buildRequest(`missing-${fixtureId}`),

      principal,

      prisma,
    });

    assert.equal(missingTransfer.status, 404);

    assert.deepEqual(missingTransfer.body, {
      ok: false,

      error: "TREASURY_TRANSFER_NOT_FOUND",
    });

    const first = await beginTreasuryTransferAuthorityReviewHttp({
      rawTransferId: `  ${transferId}  `,

      request: buildRequest(idempotencyKey),

      principal,

      prisma,
    });

    assert.equal(first.status, 200);

    assert.equal(first.body.ok, true);

    if (!first.body.ok) {
      throw new Error("[CONTROL_CENTER_AUTHORITY_REVIEW_EXPECTED_SUCCESS]");
    }

    assert.equal(first.body.disposition, "STARTED");

    assert.equal(first.body.transfer.id, transferId);

    assert.equal(first.body.transfer.status, "AUTHORITY_REVIEW");

    assert.equal(first.body.transfer.version, 2);

    const retry = await beginTreasuryTransferAuthorityReviewHttp({
      rawTransferId: transferId,

      request: buildRequest(idempotencyKey),

      principal,

      prisma,
    });

    assert.equal(retry.status, 200);

    assert.equal(retry.body.ok, true);

    if (!retry.body.ok) {
      throw new Error(
        "[CONTROL_CENTER_AUTHORITY_REVIEW_RETRY_EXPECTED_SUCCESS]",
      );
    }

    assert.equal(retry.body.disposition, "REPLAYED");

    assert.equal(retry.body.transfer.version, 2);

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const receipt = await prisma.treasuryGatewayCommandReceipt.findUnique({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(eventCount, 2);

    assert(receipt);

    assert.equal(receipt.actorId, principal.userId);

    assert.equal(receipt.aggregateId, transferId);

    const wrongActor: Principal = {
      ...principal,

      userId: `different-operator-${fixtureId}`,
    };

    const collision = await beginTreasuryTransferAuthorityReviewHttp({
      rawTransferId: transferId,

      request: buildRequest(idempotencyKey),

      principal: wrongActor,

      prisma,
    });

    assert.equal(collision.status, 409);

    assert.deepEqual(collision.body, {
      ok: false,

      error: "TREASURY_AUTHORITY_REVIEW_IDEMPOTENCY_COLLISION",
    });

    const differentKey = await beginTreasuryTransferAuthorityReviewHttp({
      rawTransferId: transferId,

      request: buildRequest(`new-review-${fixtureId}`),

      principal,

      prisma,
    });

    assert.equal(differentKey.status, 409);

    assert.deepEqual(differentKey.body, {
      ok: false,

      error: "TREASURY_AUTHORITY_REVIEW_TRANSITION_INVALID",
    });

    const finalEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    assert.equal(finalEventCount, 2);

    console.log(
      "✓ Control Center Treasury authority review HTTP smoke test passed",
    );

    console.log({
      cases: {
        missingIdempotencyKey: {
          status: missingKey.status,
        },

        missingTransfer: {
          status: missingTransfer.status,
        },

        firstReview: {
          status: first.status,

          disposition: first.body.disposition,

          transferStatus: first.body.transfer.status,

          version: first.body.transfer.version,
        },

        exactRetry: {
          status: retry.status,

          disposition: retry.body.disposition,
        },

        changedActorCollision: {
          status: collision.status,
        },

        repeatWithNewRequestIdentity: {
          status: differentKey.status,
        },
      },

      durableState: {
        events: finalEventCount,

        receipt: receipt ? 1 : 0,
      },

      invariants: {
        idempotencyKeyRequired: true,

        missingTransferReturns404: true,

        authenticatedPrincipalBecomesActor: true,

        createdTransferCanEnterReview: true,

        reviewReturns200: true,

        exactRetryReturns200: true,

        exactRetryReturnsExistingTransfer: true,

        changedActorWithSameKeyRejected: true,

        repeatReviewWithNewKeyRejected: true,

        failedRepeatAppendsNoEvent: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        aggregateId: transferId,
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
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
