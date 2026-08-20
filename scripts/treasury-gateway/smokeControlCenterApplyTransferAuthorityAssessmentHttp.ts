import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";

import { applyTransferAuthorityAssessmentHttp } from "../../src/domains/control-center/treasury/applyTransferAuthorityAssessmentHttp";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function buildRequest(idempotencyKey?: string): Request {
  const headers = new Headers();

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers/example/authority-assessments/example/apply",
    {
      method: "POST",

      headers,
    },
  );
}

async function createReviewedTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-HTTP-AUTHORITY-APPLY-${suffix}-${fixtureId}`,

      eventId: `smoke-http-authority-apply-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-http-authority-apply-create-command-${suffix}-${fixtureId}`,

        actorId: `smoke-http-authority-apply-creator-${fixtureId}`,

        correlationId: `smoke-http-authority-apply-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-20T10:00:00.000Z"),

        idempotencyKey: `smoke-http-authority-apply-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `smoke-http-authority-apply-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-http-authority-apply-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-http-authority-apply-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "400000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Control Center authority assessment application smoke ${suffix}`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `smoke-http-authority-apply-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-http-authority-apply-review-command-${suffix}-${fixtureId}`,

      actorId: `smoke-http-authority-apply-reviewer-${fixtureId}`,

      correlationId: `smoke-http-authority-apply-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-20T10:01:00.000Z"),

      idempotencyKey: `smoke-http-authority-apply-review-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function recordAssessment(params: {
  assessmentId: string;

  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { assessmentId, transferId, suffix, fixtureId, client } = params;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `smoke-http-authority-apply-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-http-authority-apply-assessment-command-${suffix}-${fixtureId}`,

        actorId: `smoke-http-authority-assessor-${fixtureId}`,

        correlationId: `smoke-http-authority-apply-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-20T10:02:00.000Z"),

        idempotencyKey: `smoke-http-authority-apply-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `smoke-http-authority-apply-artifact-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-20T10:01:30.000Z"),

        notes: `HTTP authority application assessment ${suffix}`,
      },
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-http-authority-apply-transfer-${fixtureId}`;

  const assessmentId = `smoke-http-authority-apply-assessment-${fixtureId}`;

  const otherTransferId = `smoke-http-authority-apply-other-transfer-${fixtureId}`;

  const otherAssessmentId = `smoke-http-authority-apply-other-assessment-${fixtureId}`;

  const idempotencyKey = `smoke-http-authority-apply-key-${fixtureId}`;

  const approverId = `smoke-http-authority-approver-${fixtureId}`;

  const principal: Principal = {
    userId: approverId,

    email: `authority-approver-${fixtureId}@example.test`,

    displayName: "Authority Application Smoke Operator",

    roles: ["TREASURY_OPERATOR"],

    permissions: ["TREASURY_READ", "TREASURY_APPROVE"],
  };

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createReviewedTransfer({
        transferId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await recordAssessment({
        assessmentId,

        transferId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await createReviewedTransfer({
        transferId: otherTransferId,

        suffix: "other",

        fixtureId,

        client: tx,
      });

      await recordAssessment({
        assessmentId: otherAssessmentId,

        transferId: otherTransferId,

        suffix: "other",

        fixtureId,

        client: tx,
      });
    });

    const missingKey = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: assessmentId,

      request: buildRequest(),

      principal,

      prisma,
    });

    assert.equal(missingKey.status, 400);

    const missingTransfer = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: `missing-transfer-${fixtureId}`,

      rawAssessmentId: assessmentId,

      request: buildRequest(`missing-transfer-${fixtureId}`),

      principal,

      prisma,
    });

    assert.equal(missingTransfer.status, 404);

    const missingAssessment = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: `missing-assessment-${fixtureId}`,

      request: buildRequest(`missing-assessment-${fixtureId}`),

      principal,

      prisma,
    });

    assert.equal(missingAssessment.status, 404);

    const mismatch = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: otherAssessmentId,

      request: buildRequest(`mismatch-${fixtureId}`),

      principal,

      prisma,
    });

    assert.equal(mismatch.status, 409);

    const first = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: `  ${transferId}  `,

      rawAssessmentId: `  ${assessmentId}  `,

      request: buildRequest(idempotencyKey),

      principal,

      prisma,

      generateIdentity: (() => {
        let index = 0;

        return () => `first-${index++}-${fixtureId}`;
      })(),

      now: () => new Date("2026-08-20T10:03:00.000Z"),
    });

    assert.equal(first.status, 200);

    assert.equal(first.body.ok, true);

    if (!first.body.ok) {
      throw new Error(
        "[CONTROL_CENTER_AUTHORITY_APPLICATION_EXPECTED_SUCCESS]",
      );
    }

    assert.equal(first.body.disposition, "APPLIED");

    assert.equal(first.body.transfer.id, transferId);

    assert.equal(first.body.transfer.status, "AUTHORIZED");

    assert.equal(first.body.transfer.version, 3);

    assert.equal(first.body.assessmentId, assessmentId);

    const retry = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: assessmentId,

      request: buildRequest(idempotencyKey),

      principal,

      prisma,

      generateIdentity: (() => {
        let index = 0;

        return () => `retry-${index++}-${fixtureId}`;
      })(),

      now: () => new Date("2026-08-20T10:04:00.000Z"),
    });

    assert.equal(retry.status, 200);

    assert.equal(retry.body.ok, true);

    if (!retry.body.ok) {
      throw new Error(
        "[CONTROL_CENTER_AUTHORITY_APPLICATION_RETRY_EXPECTED_SUCCESS]",
      );
    }

    assert.equal(retry.body.disposition, "REPLAYED");

    assert.equal(retry.body.transfer.id, transferId);

    assert.equal(retry.body.transfer.status, "AUTHORIZED");

    assert.equal(retry.body.transfer.version, 3);

    const changedAssessment = await applyTransferAuthorityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: otherAssessmentId,

      request: buildRequest(idempotencyKey),

      principal,

      prisma,
    });

    assert.equal(changedAssessment.status, 409);

    const transferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    /*
     * CREATED
     * AUTHORITY_REVIEW_STARTED
     * AUTHORIZED
     */
    assert.equal(transferEventCount, 3);

    const applicationReceipt =
      await prisma.treasuryGatewayCommandReceipt.findUnique({
        where: {
          idempotencyKey,
        },
      });

    assert(applicationReceipt);

    assert.equal(applicationReceipt.aggregateId, transferId);

    assert.equal(applicationReceipt.actorId, approverId);

    console.log(
      "✓ Control Center Treasury authority assessment application HTTP smoke test passed",
    );

    console.log({
      cases: {
        missingIdempotencyKey: {
          status: missingKey.status,
        },

        missingTransfer: {
          status: missingTransfer.status,
        },

        missingAssessment: {
          status: missingAssessment.status,
        },

        mismatchedAssessment: {
          status: mismatch.status,
        },

        firstApplication: {
          status: first.status,

          disposition: first.body.disposition,

          transferStatus: first.body.transfer.status,

          version: first.body.transfer.version,
        },

        exactRetry: {
          status: retry.status,

          disposition: retry.body.disposition,

          transferStatus: retry.body.transfer.status,

          version: retry.body.transfer.version,
        },

        changedAssessmentCollision: {
          status: changedAssessment.status,
        },
      },

      durableState: {
        transferEvents: transferEventCount,

        applicationReceipts: applicationReceipt ? 1 : 0,
      },

      invariants: {
        idempotencyKeyRequired: true,

        canonicalTransferRequired: true,

        canonicalAssessmentRequired: true,

        mismatchedAssessmentRejected: true,

        authenticatedPrincipalBecomesApplyingActor: true,

        callerSuppliesIdentitiesOnly: true,

        recordedFindingDeterminesOutcome: true,

        authorizedFindingProducesAuthorizedTransfer: true,

        transferAdvancesToVersionThree: true,

        firstApplicationReturns200: true,

        exactRetryReturns200: true,

        exactRetryReplaysAppliedTransfer: true,

        exactRetryDoesNotAdvanceVersion: true,

        exactRetryAppendsNoDuplicateTransferEvent: true,

        changedAssessmentWithSameKeyRejected: true,

        durableApplicationReceiptRetained: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        OR: [
          {
            idempotencyKey,
          },

          {
            aggregateId: {
              in: [transferId, otherTransferId],
            },
          },
        ],
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        OR: [
          {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: {
              in: [transferId, otherTransferId],
            },
          },

          {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

            aggregateId: {
              in: [assessmentId, otherAssessmentId],
            },
          },
        ],
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        OR: [
          {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: {
              in: [transferId, otherTransferId],
            },
          },

          {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

            aggregateId: {
              in: [assessmentId, otherAssessmentId],
            },
          },
        ],
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
