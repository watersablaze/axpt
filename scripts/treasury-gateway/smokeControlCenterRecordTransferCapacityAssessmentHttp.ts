import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";

import { recordTransferCapacityAssessmentHttp } from "../../src/domains/control-center/treasury/recordTransferCapacityAssessmentHttp";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

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

function createJsonRequest(params: {
  body: unknown;

  idempotencyKey?: string;
}): Request {
  const { body, idempotencyKey } = params;

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers/test/capacity-assessments",
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

      reference: `AXPT-CAPACITY-HTTP-${suffix}-${fixtureId}`,

      eventId: `capacity-http-transfer-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-http-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `capacity-http-transfer-creator-${fixtureId}`,

        correlationId: `capacity-http-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T23:00:00.000Z"),

        idempotencyKey: `capacity-http-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `capacity-http-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `capacity-http-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `capacity-http-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Control Center Capacity HTTP smoke ${suffix}.`,
      },
    },

    client,
  });
}

async function authorizeTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `capacity-http-authority-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-http-authority-review-command-${suffix}-${fixtureId}`,

      actorId: `capacity-http-authority-reviewer-${fixtureId}`,

      correlationId: `capacity-http-authority-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T23:01:00.000Z"),

      idempotencyKey: `capacity-http-authority-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `capacity-http-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `capacity-http-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-http-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `capacity-http-authority-assessor-${fixtureId}`,

        correlationId: `capacity-http-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T23:02:00.000Z"),

        idempotencyKey: `capacity-http-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `capacity-http-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-21T23:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `capacity-http-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-http-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `capacity-http-authority-applicator-${fixtureId}`,

      correlationId: `capacity-http-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T23:03:00.000Z"),

      idempotencyKey: `capacity-http-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const assessorId = `capacity-http-assessor-${fixtureId}`;

  const authorizedTransferId = `capacity-http-authorized-transfer-${fixtureId}`;

  const createdTransferId = `capacity-http-created-transfer-${fixtureId}`;

  const missingTransferId = `capacity-http-missing-transfer-${fixtureId}`;

  const successfulIdempotencyKey = `capacity-http-success-${fixtureId}`;

  const principal = {
    userId: assessorId,
  } as Principal;

  const assessedAt = "2026-08-21T23:04:00.000Z";

  const canonicalBody = {
    requestedAmount: {
      amount: "1000000.00",

      currency: "USD",
    },

    constraints: [
      {
        type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

        status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

        limit: {
          amount: "850000.00",

          currency: "USD",
        },

        evidenceReferenceIds: [`capacity-http-source-evidence-${fixtureId}`],
      },

      {
        type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

        status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

        limit: {
          amount: "600000.00",

          currency: "USD",
        },

        evidenceReferenceIds: [`capacity-http-rail-evidence-${fixtureId}`],
      },

      {
        type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,

        status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,

        evidenceReferenceIds: [],
      },
    ],

    assessedAt,

    notes: "Control Center Capacity Assessment HTTP smoke.",

    /*
     * Deliberate hostile/irrelevant field.
     *
     * The Control Center may not manufacture executable capacity.
     * The HTTP parser ignores this and Treasury computes its own
     * executableNow from the canonical constraint set.
     */
    executableNow: {
      amount: "999999999.00",

      currency: "USD",
    },
  };

  try {
    /*
     * Fixture one earns AUTHORIZED posture canonically.
     *
     * Fixture two remains CREATED so the HTTP boundary can prove
     * that Capacity Assessment cannot begin prematurely.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await originateTransfer({
        transferId: authorizedTransferId,

        suffix: "authorized",

        fixtureId,

        client: tx,
      });

      await authorizeTransfer({
        transferId: authorizedTransferId,

        suffix: "authorized",

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

    /*
     * Missing idempotency identity.
     */
    const missingIdempotencyKey = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        body: canonicalBody,
      }),

      principal,

      prisma,
    });

    assert.equal(missingIdempotencyKey.status, 400);

    assert(!missingIdempotencyKey.body.ok);

    assert.equal(missingIdempotencyKey.body.error, "IDEMPOTENCY_KEY_REQUIRED");

    /*
     * Requested amount must have TreasuryMoney shape.
     */
    const invalidRequestedAmount = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-invalid-amount-${fixtureId}`,

        body: {
          ...canonicalBody,

          requestedAmount: {
            amount: 1000000,

            currency: "USD",
          },
        },
      }),

      principal,

      prisma,
    });

    assert.equal(invalidRequestedAmount.status, 400);

    assert(!invalidRequestedAmount.body.ok);

    assert.equal(
      invalidRequestedAmount.body.error,
      "CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_INVALID",
    );

    /*
     * At least one constraint must be supplied.
     */
    const missingConstraints = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-missing-constraints-${fixtureId}`,

        body: {
          ...canonicalBody,

          constraints: [],
        },
      }),

      principal,

      prisma,
    });

    assert.equal(missingConstraints.status, 400);

    assert(!missingConstraints.body.ok);

    assert.equal(
      missingConstraints.body.error,
      "CAPACITY_ASSESSMENT_CONSTRAINTS_REQUIRED",
    );

    /*
     * Constraint vocabulary is closed at the HTTP boundary.
     */
    const invalidConstraintType = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-invalid-constraint-type-${fixtureId}`,

        body: {
          ...canonicalBody,

          constraints: [
            {
              ...canonicalBody.constraints[0],

              type: "INVENTED_CAPACITY_CONSTRAINT",
            },
          ],
        },
      }),

      principal,

      prisma,
    });

    assert.equal(invalidConstraintType.status, 400);

    assert(!invalidConstraintType.body.ok);

    assert.equal(
      invalidConstraintType.body.error,
      "CAPACITY_ASSESSMENT_CONSTRAINT_TYPE_INVALID:0",
    );

    /*
     * Assessment timestamp must be a valid date.
     */
    const invalidAssessedAt = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-invalid-assessed-at-${fixtureId}`,

        body: {
          ...canonicalBody,

          assessedAt: "not-a-date",
        },
      }),

      principal,

      prisma,
    });

    assert.equal(invalidAssessedAt.status, 400);

    assert(!invalidAssessedAt.body.ok);

    assert.equal(
      invalidAssessedAt.body.error,
      "CAPACITY_ASSESSMENT_ASSESSED_AT_INVALID",
    );

    /*
     * Capacity Assessment requires a canonical Transfer.
     */
    const missingTransfer = await recordTransferCapacityAssessmentHttp({
      rawTransferId: missingTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-missing-transfer-${fixtureId}`,

        body: canonicalBody,
      }),

      principal,

      prisma,
    });

    assert.equal(missingTransfer.status, 404);

    assert(!missingTransfer.body.ok);

    assert.equal(missingTransfer.body.error, "TREASURY_TRANSFER_NOT_FOUND");

    /*
     * A CREATED Transfer has not yet earned entrance to Capacity
     * Assessment.
     */
    const wrongTransferPosture = await recordTransferCapacityAssessmentHttp({
      rawTransferId: createdTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-wrong-posture-${fixtureId}`,

        body: canonicalBody,
      }),

      principal,

      prisma,
    });

    assert.equal(wrongTransferPosture.status, 409);

    assert(!wrongTransferPosture.body.ok);

    assert.equal(
      wrongTransferPosture.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
    );

    /*
     * HTTP callers cannot quietly change the amount whose
     * capacity is being assessed.
     */
    const alteredRequestedAmount = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: `capacity-http-altered-amount-${fixtureId}`,

        body: {
          ...canonicalBody,

          requestedAmount: {
            amount: "400000.00",

            currency: "USD",
          },
        },
      }),

      principal,

      prisma,
    });

    assert.equal(alteredRequestedAmount.status, 409);

    assert(!alteredRequestedAmount.body.ok);

    assert.equal(
      alteredRequestedAmount.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_MISMATCH",
    );

    /*
     * First canonical Capacity finding.
     *
     * Note that canonicalBody contains a malicious executableNow
     * value. That field must never influence the Treasury result.
     */
    const firstAssessment = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: successfulIdempotencyKey,

        body: canonicalBody,
      }),

      principal,

      prisma,

      now: () => new Date("2026-08-21T23:05:00.000Z"),
    });

    assert.equal(firstAssessment.status, 201);

    assert(firstAssessment.body.ok);

    assert.equal(firstAssessment.body.disposition, "RECORDED");

    const firstAssessmentId = firstAssessment.body.assessment.id;

    assert.equal(
      firstAssessment.body.assessment.transferId,
      authorizedTransferId,
    );

    assert.equal(firstAssessment.body.assessment.assessedByActorId, assessorId);

    assert.deepEqual(firstAssessment.body.assessment.requestedAmount, {
      amount: "1000000.00",

      currency: "USD",
    });

    /*
     * SOURCE_FUNDS = 850k
     * RAIL         = 600k
     * CONVERSION   = NOT_REQUIRED
     *
     * Treasury, not the caller, determines 600k executable now.
     */
    assert.deepEqual(firstAssessment.body.assessment.executableNow, {
      amount: "600000.00",

      currency: "USD",
    });

    assert.notDeepEqual(
      firstAssessment.body.assessment.executableNow,
      canonicalBody.executableNow,
    );

    assert.equal(firstAssessment.body.assessment.version, 1);

    /*
     * Recording the Capacity finding alone must not transition
     * the Transfer.
     */
    const transferAfterRecording =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: authorizedTransferId,
          },
        },
      });

    assert(transferAfterRecording);

    assert.equal(
      transferAfterRecording.status,
      TREASURY_TRANSFER_STATUS.AUTHORIZED,
    );

    assert.equal(transferAfterRecording.version, 3);

    /*
     * Exact retry uses the same semantic request and idempotency
     * key. HTTP-generated assessment/event/command identities may
     * differ, but Treasury must return the original assessment.
     */
    const exactRetry = await recordTransferCapacityAssessmentHttp({
      rawTransferId: authorizedTransferId,

      request: createJsonRequest({
        idempotencyKey: successfulIdempotencyKey,

        body: canonicalBody,
      }),

      principal,

      prisma,

      now: () => new Date("2026-08-21T23:06:00.000Z"),
    });

    assert.equal(exactRetry.status, 200);

    assert(exactRetry.body.ok);

    assert.equal(exactRetry.body.disposition, "REPLAYED");

    assert.equal(exactRetry.body.assessment.id, firstAssessmentId);

    assert.deepEqual(exactRetry.body.assessment.executableNow, {
      amount: "600000.00",

      currency: "USD",
    });

    /*
     * Same idempotency key with a materially changed Capacity
     * constraint is not a retry.
     */
    const changedConstraintCollision =
      await recordTransferCapacityAssessmentHttp({
        rawTransferId: authorizedTransferId,

        request: createJsonRequest({
          idempotencyKey: successfulIdempotencyKey,

          body: {
            ...canonicalBody,

            constraints: [
              canonicalBody.constraints[0],

              {
                ...canonicalBody.constraints[1],

                limit: {
                  amount: "500000.00",

                  currency: "USD",
                },
              },

              canonicalBody.constraints[2],
            ],
          },
        }),

        principal,

        prisma,
      });

    assert.equal(changedConstraintCollision.status, 409);

    assert(!changedConstraintCollision.body.ok);

    assert.equal(
      changedConstraintCollision.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_IDEMPOTENCY_COLLISION",
    );

    /*
     * Only one canonical Capacity finding, event, and command
     * receipt may exist after first request + retry + collision.
     */
    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: firstAssessmentId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: firstAssessmentId,
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey: successfulIdempotencyKey,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    assert.equal(receiptCount, 1);

    const invalidAssessmentCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        NOT: {
          aggregateId: firstAssessmentId,
        },

        snapshot: {
          path: ["transferId"],

          equals: authorizedTransferId,
        },
      },
    });

    assert.equal(invalidAssessmentCount, 0);

    console.log(
      "✓ Control Center Treasury Capacity Assessment recording HTTP smoke test passed",
    );

    console.log({
      cases: {
        missingIdempotencyKey: {
          status: missingIdempotencyKey.status,
        },

        invalidRequestedAmount: {
          status: invalidRequestedAmount.status,
        },

        missingConstraints: {
          status: missingConstraints.status,
        },

        invalidConstraintType: {
          status: invalidConstraintType.status,
        },

        invalidAssessedAt: {
          status: invalidAssessedAt.status,
        },

        missingTransfer: {
          status: missingTransfer.status,
        },

        wrongTransferPosture: {
          status: wrongTransferPosture.status,
        },

        alteredRequestedAmount: {
          status: alteredRequestedAmount.status,
        },

        firstAssessment: {
          status: firstAssessment.status,

          disposition: firstAssessment.body.disposition,

          assessmentId: firstAssessmentId,

          transferId: firstAssessment.body.assessment.transferId,

          executableNow: firstAssessment.body.assessment.executableNow,
        },

        exactRetry: {
          status: exactRetry.status,

          disposition: exactRetry.body.disposition,

          assessmentId: exactRetry.body.assessment.id,
        },

        changedConstraintCollision: {
          status: changedConstraintCollision.status,
        },
      },

      targetTransfer: {
        status: transferAfterRecording.status,

        version: transferAfterRecording.version,
      },

      durableState: {
        aggregates: aggregateCount,

        events: eventCount,

        receipts: receiptCount,
      },

      invariants: {
        idempotencyKeyRequired: true,

        requestedAmountShapeRequired: true,

        constraintsRequired: true,

        canonicalConstraintTypeRequired: true,

        validAssessmentTimestampRequired: true,

        canonicalTransferRequired: true,

        authorizedTransferRequired: true,

        canonicalRequestedAmountRequired: true,

        missingTransferReturns404: true,

        createdTransferReturns409: true,

        alteredRequestedAmountReturns409: true,

        routeTransferIdentityBecomesAssessmentTarget: true,

        authenticatedPrincipalBecomesAssessor: true,

        callerCannotSupplyExecutableCapacity: true,

        executableCapacityComputedByTreasury: true,

        lowestApplicableConstraintControlsExecutableCapacity: true,

        firstFindingReturns201: true,

        firstFindingRecordedDurably: true,

        recordingDoesNotAdvanceTransfer: true,

        exactRetryReturns200: true,

        exactRetryReplaysOriginalAssessment: true,

        retryReturnsOriginalCanonicalAssessmentIdentity: true,

        changedConstraintWithSameKeyRejected: true,

        retryCreatesNoDuplicateAssessment: true,

        retryAppendsNoDuplicateAssessmentEvent: true,

        durableCommandReceiptRetained: true,

        invalidAttemptsCreateNoAdditionalAssessment: true,
      },
    });
  } finally {
    /*
     * Capacity command receipts.
     */
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        idempotencyKey: {
          contains: fixtureId,
        },
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
     * Authority findings used to place the positive fixture into
     * AUTHORIZED posture.
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
          in: [authorizedTransferId, createdTransferId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [authorizedTransferId, createdTransferId],
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
