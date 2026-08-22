import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";

import { applyTransferCapacityAssessmentHttp } from "../../src/domains/control-center/treasury/applyTransferCapacityAssessmentHttp";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const prisma = new PrismaClient();

function createPostRequest(idempotencyKey?: string): Request {
  const headers = new Headers();

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers/test/capacity-assessments/test/apply",
    {
      method: "POST",

      headers,
    },
  );
}

async function createAuthorizedTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-CAPACITY-HTTP-APPLY-${suffix}-${fixtureId}`,

      eventId: `capacity-http-apply-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-http-apply-create-command-${suffix}-${fixtureId}`,

        actorId: `capacity-http-apply-creator-${fixtureId}`,

        correlationId: `capacity-http-apply-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-22T00:00:00.000Z"),

        idempotencyKey: `capacity-http-apply-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `capacity-http-apply-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `capacity-http-apply-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `capacity-http-apply-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Control Center Capacity application HTTP smoke ${suffix}.`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `capacity-http-apply-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-http-apply-review-command-${suffix}-${fixtureId}`,

      actorId: `capacity-http-apply-reviewer-${fixtureId}`,

      correlationId: `capacity-http-apply-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-22T00:01:00.000Z"),

      idempotencyKey: `capacity-http-apply-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `capacity-http-apply-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `capacity-http-apply-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-http-apply-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `capacity-http-apply-authority-assessor-${fixtureId}`,

        correlationId: `capacity-http-apply-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-22T00:02:00.000Z"),

        idempotencyKey: `capacity-http-apply-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `capacity-http-apply-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-22T00:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `capacity-http-apply-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-http-apply-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `capacity-http-apply-authority-applicator-${fixtureId}`,

      correlationId: `capacity-http-apply-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-22T00:03:00.000Z"),

      idempotencyKey: `capacity-http-apply-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function recordCapacityAssessment(params: {
  transferId: string;

  assessmentId: string;

  suffix: string;

  fixtureId: string;

  undetermined?: boolean;

  client: TransactionClient;
}): Promise<void> {
  const {
    transferId,
    assessmentId,
    suffix,
    fixtureId,
    undetermined = false,
    client,
  } = params;

  await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `capacity-http-apply-capacity-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-http-apply-capacity-command-${suffix}-${fixtureId}`,

        actorId: `capacity-http-apply-capacity-assessor-${fixtureId}`,

        correlationId: `capacity-http-apply-capacity-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-22T00:04:00.000Z"),

        idempotencyKey: `capacity-http-apply-capacity-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        constraints: undetermined
          ? [
              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

                limit: {
                  amount: "850000.00",

                  currency: "USD",
                },

                evidenceReferenceIds: [
                  `capacity-http-apply-source-evidence-${suffix}-${fixtureId}`,
                ],
              },

              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.UNDETERMINED,

                evidenceReferenceIds: [
                  `capacity-http-apply-rail-evidence-${suffix}-${fixtureId}`,
                ],
              },
            ]
          : [
              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

                limit: {
                  amount: "850000.00",

                  currency: "USD",
                },

                evidenceReferenceIds: [
                  `capacity-http-apply-source-evidence-${suffix}-${fixtureId}`,
                ],
              },

              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

                limit: {
                  amount: "600000.00",

                  currency: "USD",
                },

                evidenceReferenceIds: [
                  `capacity-http-apply-rail-evidence-${suffix}-${fixtureId}`,
                ],
              },
            ],

        assessedAt: new Date("2026-08-22T00:03:30.000Z"),

        notes: `Control Center Capacity application HTTP assessment ${suffix}.`,
      },
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const applicatorId = `capacity-http-apply-applicator-${fixtureId}`;

  const transferId = `capacity-http-apply-transfer-${fixtureId}`;

  const assessmentId = `capacity-http-apply-assessment-${fixtureId}`;

  const otherAssessmentId = `capacity-http-apply-other-assessment-${fixtureId}`;

  const undeterminedTransferId = `capacity-http-apply-undetermined-transfer-${fixtureId}`;

  const undeterminedAssessmentId = `capacity-http-apply-undetermined-assessment-${fixtureId}`;

  const mismatchTargetTransferId = `capacity-http-apply-mismatch-target-${fixtureId}`;

  const mismatchOtherTransferId = `capacity-http-apply-mismatch-other-${fixtureId}`;

  const mismatchedAssessmentId = `capacity-http-apply-mismatched-assessment-${fixtureId}`;

  const missingTransferSourceId = `capacity-http-apply-missing-source-${fixtureId}`;

  const missingTransferAssessmentId = `capacity-http-apply-missing-transfer-assessment-${fixtureId}`;

  const missingTransferId = `capacity-http-apply-missing-transfer-${fixtureId}`;

  const applicationIdempotencyKey = `capacity-http-apply-success-${fixtureId}`;

  const principal = {
    userId: applicatorId,
  } as Principal;

  const transferIds = [
    transferId,
    undeterminedTransferId,
    mismatchTargetTransferId,
    mismatchOtherTransferId,
    missingTransferSourceId,
  ];

  try {
    /*
     * Establish every positive prerequisite canonically.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createAuthorizedTransfer({
        transferId,

        suffix: "determinate",

        fixtureId,

        client: tx,
      });

      await recordCapacityAssessment({
        transferId,

        assessmentId,

        suffix: "determinate",

        fixtureId,

        client: tx,
      });

      /*
       * A second finding against the still-authorized Transfer
       * exists only to prove changed assessment identity under
       * the same application key is a collision.
       */
      await recordCapacityAssessment({
        transferId,

        assessmentId: otherAssessmentId,

        suffix: "other",

        fixtureId,

        client: tx,
      });

      await createAuthorizedTransfer({
        transferId: undeterminedTransferId,

        suffix: "undetermined",

        fixtureId,

        client: tx,
      });

      await recordCapacityAssessment({
        transferId: undeterminedTransferId,

        assessmentId: undeterminedAssessmentId,

        suffix: "undetermined",

        fixtureId,

        undetermined: true,

        client: tx,
      });

      await createAuthorizedTransfer({
        transferId: mismatchTargetTransferId,

        suffix: "mismatch-target",

        fixtureId,

        client: tx,
      });

      await createAuthorizedTransfer({
        transferId: mismatchOtherTransferId,

        suffix: "mismatch-other",

        fixtureId,

        client: tx,
      });

      await recordCapacityAssessment({
        transferId: mismatchOtherTransferId,

        assessmentId: mismatchedAssessmentId,

        suffix: "mismatch",

        fixtureId,

        client: tx,
      });

      await createAuthorizedTransfer({
        transferId: missingTransferSourceId,

        suffix: "missing-source",

        fixtureId,

        client: tx,
      });

      await recordCapacityAssessment({
        transferId: missingTransferSourceId,

        assessmentId: missingTransferAssessmentId,

        suffix: "missing-transfer",

        fixtureId,

        client: tx,
      });
    });

    /*
     * Missing idempotency identity.
     */
    const missingIdempotencyKey = await applyTransferCapacityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: assessmentId,

      request: createPostRequest(),

      principal,

      prisma,
    });

    assert.equal(missingIdempotencyKey.status, 400);

    assert(!missingIdempotencyKey.body.ok);

    assert.equal(missingIdempotencyKey.body.error, "IDEMPOTENCY_KEY_REQUIRED");

    /*
     * Missing canonical Capacity Assessment.
     */
    const missingAssessment = await applyTransferCapacityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: `missing-capacity-assessment-${fixtureId}`,

      request: createPostRequest(
        `capacity-http-apply-missing-assessment-${fixtureId}`,
      ),

      principal,

      prisma,
    });

    assert.equal(missingAssessment.status, 404);

    assert(!missingAssessment.body.ok);

    assert.equal(
      missingAssessment.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_NOT_FOUND",
    );

    /*
     * Canonical Assessment exists, target Transfer does not.
     */
    const missingTransfer = await applyTransferCapacityAssessmentHttp({
      rawTransferId: missingTransferId,

      rawAssessmentId: missingTransferAssessmentId,

      request: createPostRequest(
        `capacity-http-apply-missing-transfer-${fixtureId}`,
      ),

      principal,

      prisma,
    });

    assert.equal(missingTransfer.status, 404);

    assert(!missingTransfer.body.ok);

    assert.equal(missingTransfer.body.error, "TREASURY_TRANSFER_NOT_FOUND");

    /*
     * Assessment may not be applied to another Transfer.
     */
    const mismatchedAssessment = await applyTransferCapacityAssessmentHttp({
      rawTransferId: mismatchTargetTransferId,

      rawAssessmentId: mismatchedAssessmentId,

      request: createPostRequest(`capacity-http-apply-mismatch-${fixtureId}`),

      principal,

      prisma,
    });

    assert.equal(mismatchedAssessment.status, 409);

    assert(!mismatchedAssessment.body.ok);

    assert.equal(
      mismatchedAssessment.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_TARGET_MISMATCH",
    );

    /*
     * First determinate application.
     */
    const firstApplication = await applyTransferCapacityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: assessmentId,

      request: createPostRequest(applicationIdempotencyKey),

      principal,

      prisma,

      now: () => new Date("2026-08-22T00:05:00.000Z"),
    });

    assert.equal(firstApplication.status, 200);

    assert(firstApplication.body.ok);

    assert.equal(firstApplication.body.disposition, "APPLIED");

    assert.equal(firstApplication.body.transfer.id, transferId);

    assert.equal(
      firstApplication.body.transfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(firstApplication.body.transfer.version, 4);

    assert.equal(firstApplication.body.assessmentId, assessmentId);

    /*
     * Exact retry returns canonical Transfer state and does not
     * apply the same Capacity finding twice.
     */
    const exactRetry = await applyTransferCapacityAssessmentHttp({
      rawTransferId: transferId,

      rawAssessmentId: assessmentId,

      request: createPostRequest(applicationIdempotencyKey),

      principal,

      prisma,

      now: () => new Date("2026-08-22T00:06:00.000Z"),
    });

    assert.equal(exactRetry.status, 200);

    assert(exactRetry.body.ok);

    assert.equal(exactRetry.body.disposition, "REPLAYED");

    assert.equal(
      exactRetry.body.transfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(exactRetry.body.transfer.version, 4);

    /*
     * Same idempotency key, different Capacity finding.
     */
    const changedAssessmentCollision =
      await applyTransferCapacityAssessmentHttp({
        rawTransferId: transferId,

        rawAssessmentId: otherAssessmentId,

        request: createPostRequest(applicationIdempotencyKey),

        principal,

        prisma,
      });

    assert.equal(changedAssessmentCollision.status, 409);

    assert(!changedAssessmentCollision.body.ok);

    assert.equal(
      changedAssessmentCollision.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_APPLICATION_IDEMPOTENCY_COLLISION",
    );

    const transferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const applicationReceiptCount =
      await prisma.treasuryGatewayCommandReceipt.count({
        where: {
          idempotencyKey: applicationIdempotencyKey,
        },
      });

    assert.equal(transferEventCount, 4);

    assert.equal(applicationReceiptCount, 1);

    /*
     * Undetermined Capacity is a legitimate successful
     * application outcome, not an HTTP failure.
     */
    const undeterminedApplication = await applyTransferCapacityAssessmentHttp({
      rawTransferId: undeterminedTransferId,

      rawAssessmentId: undeterminedAssessmentId,

      request: createPostRequest(
        `capacity-http-apply-undetermined-${fixtureId}`,
      ),

      principal,

      prisma,

      now: () => new Date("2026-08-22T00:07:00.000Z"),
    });

    assert.equal(undeterminedApplication.status, 200);

    assert(undeterminedApplication.body.ok);

    assert.equal(undeterminedApplication.body.disposition, "APPLIED");

    assert.equal(
      undeterminedApplication.body.transfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_UNDETERMINED,
    );

    assert.equal(undeterminedApplication.body.transfer.version, 4);

    /*
     * Invalid attempts did not mutate mismatch target.
     */
    const mismatchTarget = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: mismatchTargetTransferId,
        },
      },
    });

    assert(mismatchTarget);

    assert.equal(mismatchTarget.status, TREASURY_TRANSFER_STATUS.AUTHORIZED);

    assert.equal(mismatchTarget.version, 3);

    console.log(
      "✓ Control Center Treasury Capacity Assessment application HTTP smoke test passed",
    );

    console.log({
      cases: {
        missingIdempotencyKey: {
          status: missingIdempotencyKey.status,
        },

        missingTransfer: {
          status: missingTransfer.status,
        },

        missingAssessment: {
          status: missingAssessment.status,
        },

        mismatchedAssessment: {
          status: mismatchedAssessment.status,
        },

        firstApplication: {
          status: firstApplication.status,

          disposition: firstApplication.body.disposition,

          transferStatus: firstApplication.body.transfer.status,

          version: firstApplication.body.transfer.version,
        },

        exactRetry: {
          status: exactRetry.status,

          disposition: exactRetry.body.disposition,

          transferStatus: exactRetry.body.transfer.status,

          version: exactRetry.body.transfer.version,
        },

        changedAssessmentCollision: {
          status: changedAssessmentCollision.status,
        },

        undeterminedApplication: {
          status: undeterminedApplication.status,

          disposition: undeterminedApplication.body.disposition,

          transferStatus: undeterminedApplication.body.transfer.status,

          version: undeterminedApplication.body.transfer.version,
        },
      },

      durableState: {
        transferEvents: transferEventCount,

        applicationReceipts: applicationReceiptCount,
      },

      invariants: {
        idempotencyKeyRequired: true,

        canonicalTransferRequired: true,

        canonicalCapacityAssessmentRequired: true,

        mismatchedAssessmentRejected: true,

        authenticatedPrincipalBecomesApplyingActor: true,

        callerSuppliesIdentitiesOnly: true,

        recordedFindingDeterminesOutcome: true,

        determinateFindingProducesCapacityAssessedTransfer: true,

        undeterminedFindingProducesCapacityUndeterminedTransfer: true,

        transferAdvancesToVersionFour: true,

        firstApplicationReturns200: true,

        exactRetryReturns200: true,

        exactRetryReplaysAppliedTransfer: true,

        exactRetryDoesNotAdvanceVersion: true,

        exactRetryAppendsNoDuplicateTransferEvent: true,

        changedAssessmentWithSameKeyRejected: true,

        durableApplicationReceiptRetained: true,

        invalidApplicationLeavesTargetTransferAuthorized: true,
      },
    });
  } finally {
    /*
     * Application command receipts and any other receipts created
     * by this fixture.
     */
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

    /*
     * Capacity findings.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    /*
     * Authority findings.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    /*
     * Transfer lifecycle fixtures.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: transferIds,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: transferIds,
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
