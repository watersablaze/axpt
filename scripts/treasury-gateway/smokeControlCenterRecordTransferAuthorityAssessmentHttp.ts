import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";

import { recordTransferAuthorityAssessmentHttp } from "../../src/domains/control-center/treasury/recordTransferAuthorityAssessmentHttp";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function buildRequest(params: {
  idempotencyKey?: string;

  body: unknown;
}): Request {
  const { idempotencyKey, body } = params;

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers/example/authority-assessments",
    {
      method: "POST",

      headers,

      body: JSON.stringify(body),
    },
  );
}

async function originateTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-HTTP-AUTHORITY-ASSESSMENT-${suffix}-${fixtureId}`,

      eventId: `smoke-http-authority-assessment-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-http-authority-assessment-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `smoke-http-authority-assessment-transfer-creator-${fixtureId}`,

        correlationId: `smoke-http-authority-assessment-transfer-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-20T09:00:00.000Z"),

        idempotencyKey: `smoke-http-authority-assessment-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `smoke-http-authority-assessment-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-http-authority-assessment-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-http-authority-assessment-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "325000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Control Center authority assessment HTTP smoke ${suffix}`,
      },
    },

    client,
  });
}

async function beginReview(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `smoke-http-authority-assessment-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-http-authority-assessment-review-command-${suffix}-${fixtureId}`,

      actorId: `smoke-http-authority-assessment-reviewer-${fixtureId}`,

      correlationId: `smoke-http-authority-assessment-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-20T09:01:00.000Z"),

      idempotencyKey: `smoke-http-authority-assessment-review-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const reviewedTransferId = `smoke-http-authority-assessment-reviewed-${fixtureId}`;

  const createdTransferId = `smoke-http-authority-assessment-created-${fixtureId}`;

  const missingTransferId = `smoke-http-authority-assessment-missing-${fixtureId}`;

  const idempotencyKey = `smoke-http-authority-assessment-key-${fixtureId}`;

  const assessorId = `smoke-http-authority-assessor-${fixtureId}`;

  const assessedAt = "2026-08-20T09:02:00.000Z";

  const authorityGrantId = `smoke-http-authority-grant-${fixtureId}`;

  const instructionId = `smoke-http-authority-instruction-${fixtureId}`;

  const evidenceArtifactIds = [
    `smoke-http-authority-artifact-001-${fixtureId}`,
    `smoke-http-authority-artifact-002-${fixtureId}`,
  ];

  const principal: Principal = {
    userId: assessorId,

    email: `authority-assessor-${fixtureId}@example.test`,

    displayName: "Authority Assessment Smoke Operator",

    roles: ["TREASURY_OPERATOR"],

    permissions: ["TREASURY_READ", "TREASURY_REVIEW", "TREASURY_ASSESS"],
  };

  const validBody = {
    result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

    instructionId,

    authorityGrantId,

    evidenceArtifactIds,

    assessedAt,

    notes: "Authority established from identified documentary evidence.",
  };

  const generatedIdentities = [
    `assessment-first-${fixtureId}`,
    `event-first-${fixtureId}`,
    `command-first-${fixtureId}`,
    `correlation-first-${fixtureId}`,

    /*
     * Exact retry deliberately generates a second candidate
     * assessment identity. Command memory must return the first.
     */
    `assessment-retry-${fixtureId}`,
    `event-retry-${fixtureId}`,
    `command-retry-${fixtureId}`,
    `correlation-retry-${fixtureId}`,

    /*
     * Changed-result request.
     */
    `assessment-collision-${fixtureId}`,
    `event-collision-${fixtureId}`,
    `command-collision-${fixtureId}`,
    `correlation-collision-${fixtureId}`,
  ];

  let identityIndex = 0;

  function generateIdentity(): string {
    const value = generatedIdentities[identityIndex];

    identityIndex += 1;

    if (!value) {
      return `fallback-${identityIndex}-${fixtureId}`;
    }

    return value;
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await originateTransfer({
        transferId: reviewedTransferId,

        suffix: "reviewed",

        fixtureId,

        client: tx,
      });

      await beginReview({
        transferId: reviewedTransferId,

        suffix: "reviewed",

        fixtureId,

        client: tx,
      });

      await originateTransfer({
        transferId: createdTransferId,

        suffix: "created",

        fixtureId,

        client: tx,
      });
    });

    const missingKey = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: reviewedTransferId,

      request: buildRequest({
        body: validBody,
      }),

      principal,

      prisma,
    });

    assert.equal(missingKey.status, 400);

    assert.deepEqual(missingKey.body, {
      ok: false,

      error: "IDEMPOTENCY_KEY_REQUIRED",
    });

    const invalidResult = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: reviewedTransferId,

      request: buildRequest({
        idempotencyKey: `invalid-result-${fixtureId}`,

        body: {
          ...validBody,

          result: "MAYBE_AUTHORIZED",
        },
      }),

      principal,

      prisma,
    });

    assert.equal(invalidResult.status, 400);

    const missingEvidence = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: reviewedTransferId,

      request: buildRequest({
        idempotencyKey: `missing-evidence-${fixtureId}`,

        body: {
          ...validBody,

          evidenceArtifactIds: [],
        },
      }),

      principal,

      prisma,
    });

    assert.equal(missingEvidence.status, 400);

    const invalidAssessedAt = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: reviewedTransferId,

      request: buildRequest({
        idempotencyKey: `invalid-time-${fixtureId}`,

        body: {
          ...validBody,

          assessedAt: "not-a-date",
        },
      }),

      principal,

      prisma,
    });

    assert.equal(invalidAssessedAt.status, 400);

    const missingTransfer = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: missingTransferId,

      request: buildRequest({
        idempotencyKey: `missing-transfer-${fixtureId}`,

        body: validBody,
      }),

      principal,

      prisma,
    });

    assert.equal(missingTransfer.status, 404);

    assert.deepEqual(missingTransfer.body, {
      ok: false,

      error: "TREASURY_TRANSFER_NOT_FOUND",
    });

    const wrongPosture = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: createdTransferId,

      request: buildRequest({
        idempotencyKey: `wrong-posture-${fixtureId}`,

        body: validBody,
      }),

      principal,

      prisma,
    });

    assert.equal(wrongPosture.status, 409);

    assert.deepEqual(wrongPosture.body, {
      ok: false,

      error: "TREASURY_AUTHORITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
    });

    const first = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: `  ${reviewedTransferId}  `,

      request: buildRequest({
        idempotencyKey,

        body: validBody,
      }),

      principal,

      prisma,

      generateIdentity,

      now: () => new Date("2026-08-20T09:03:00.000Z"),
    });

    assert.equal(first.status, 201);

    assert.equal(first.body.ok, true);

    if (!first.body.ok) {
      throw new Error("[CONTROL_CENTER_AUTHORITY_ASSESSMENT_EXPECTED_SUCCESS]");
    }

    assert.equal(first.body.disposition, "RECORDED");

    assert.equal(first.body.assessment.transferId, reviewedTransferId);

    assert.equal(
      first.body.assessment.result,
      TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
    );

    assert.equal(first.body.assessment.assessedByActorId, assessorId);

    assert.equal(first.body.assessment.assessedAt, assessedAt);

    assert.equal(first.body.assessment.version, 1);

    const originalAssessmentId = first.body.assessment.id;

    const retry = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: reviewedTransferId,

      request: buildRequest({
        idempotencyKey,

        body: validBody,
      }),

      principal,

      prisma,

      generateIdentity,

      now: () => new Date("2026-08-20T09:04:00.000Z"),
    });

    assert.equal(retry.status, 200);

    assert.equal(retry.body.ok, true);

    if (!retry.body.ok) {
      throw new Error(
        "[CONTROL_CENTER_AUTHORITY_ASSESSMENT_RETRY_EXPECTED_SUCCESS]",
      );
    }

    assert.equal(retry.body.disposition, "REPLAYED");

    assert.equal(retry.body.assessment.id, originalAssessmentId);

    assert.equal(retry.body.assessment.transferId, reviewedTransferId);

    const changedResult = await recordTransferAuthorityAssessmentHttp({
      rawTransferId: reviewedTransferId,

      request: buildRequest({
        idempotencyKey,

        body: {
          ...validBody,

          result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.NOT_AUTHORIZED,
        },
      }),

      principal,

      prisma,

      generateIdentity,
    });

    assert.equal(changedResult.status, 409);

    assert.deepEqual(changedResult.body, {
      ok: false,

      error: "TREASURY_AUTHORITY_ASSESSMENT_IDEMPOTENCY_COLLISION",
    });

    const assessmentAggregateCount =
      await prisma.treasuryGatewayAggregate.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          aggregateId: originalAssessmentId,
        },
      });

    const assessmentEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: originalAssessmentId,
      },
    });

    const receipt = await prisma.treasuryGatewayCommandReceipt.findUnique({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(assessmentAggregateCount, 1);

    assert.equal(assessmentEventCount, 1);

    assert(receipt);

    assert.equal(receipt.aggregateId, originalAssessmentId);

    assert.equal(receipt.actorId, assessorId);

    const invalidTargetAssessmentCount =
      await prisma.treasuryGatewayAggregate.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          NOT: {
            aggregateId: originalAssessmentId,
          },

          OR: [
            {
              snapshot: {
                path: ["transferId"],

                equals: missingTransferId,
              },
            },
            {
              snapshot: {
                path: ["transferId"],

                equals: createdTransferId,
              },
            },
          ],
        },
      });

    assert.equal(invalidTargetAssessmentCount, 0);

    console.log(
      "✓ Control Center Treasury authority assessment recording HTTP smoke test passed",
    );

    console.log({
      cases: {
        missingIdempotencyKey: {
          status: missingKey.status,
        },

        invalidResult: {
          status: invalidResult.status,
        },

        missingEvidence: {
          status: missingEvidence.status,
        },

        invalidAssessedAt: {
          status: invalidAssessedAt.status,
        },

        missingTransfer: {
          status: missingTransfer.status,
        },

        wrongTransferPosture: {
          status: wrongPosture.status,
        },

        firstAssessment: {
          status: first.status,

          disposition: first.body.disposition,

          assessmentId: originalAssessmentId,

          transferId: first.body.assessment.transferId,

          result: first.body.assessment.result,
        },

        exactRetry: {
          status: retry.status,

          disposition: retry.body.disposition,

          assessmentId: retry.body.assessment.id,
        },

        changedResultCollision: {
          status: changedResult.status,
        },
      },

      durableState: {
        aggregates: assessmentAggregateCount,

        events: assessmentEventCount,

        receipts: receipt ? 1 : 0,
      },

      invariants: {
        idempotencyKeyRequired: true,

        invalidResultRejected: true,

        evidenceRequired: true,

        validAssessmentTimestampRequired: true,

        canonicalTransferRequired: true,

        authorityReviewPostureRequired: true,

        missingTransferReturns404: true,

        createdTransferReturns409: true,

        routeTransferIdentityBecomesAssessmentTarget: true,

        authenticatedPrincipalBecomesAssessor: true,

        firstFindingReturns201: true,

        firstFindingRecordedDurably: true,

        exactRetryReturns200: true,

        exactRetryReplaysOriginalAssessment: true,

        retryReturnsOriginalCanonicalAssessmentIdentity: true,

        changedResultWithSameKeyRejected: true,

        retryCreatesNoDuplicateAssessment: true,

        retryAppendsNoDuplicateAssessmentEvent: true,

        durableCommandReceiptRetained: true,

        invalidTargetsCreateNoAssessment: true,
      },
    });
  } finally {
    /*
     * Delete assessment command receipts associated with this smoke.
     */
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        OR: [
          {
            idempotencyKey,
          },

          {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

            aggregateId: {
              startsWith: "transfer-authority-assessment-",
            },

            actorId: assessorId,
          },
        ],
      },
    });

    /*
     * Delete authority-assessment events generated by this assessor.
     */
    const assessmentRows = await prisma.treasuryGatewayAggregate.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        snapshot: {
          path: ["assessedByActorId"],

          equals: assessorId,
        },
      },

      select: {
        aggregateId: true,
      },
    });

    const assessmentIds = assessmentRows.map(
      (row: { aggregateId: string }) => row.aggregateId,
    );

    if (assessmentIds.length > 0) {
      await prisma.treasuryGatewayEvent.deleteMany({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          aggregateId: {
            in: assessmentIds,
          },
        },
      });

      await prisma.treasuryGatewayAggregate.deleteMany({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          aggregateId: {
            in: assessmentIds,
          },
        },
      });
    }

    /*
     * Delete Transfer lifecycle fixtures.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [reviewedTransferId, createdTransferId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [reviewedTransferId, createdTransferId],
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
