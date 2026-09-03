import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";
import { recordTreasuryExecutionPlanHttp } from "../../src/domains/control-center/treasury/recordTreasuryExecutionPlanHttp";
import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";
import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";
import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";
import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";
import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";
import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";
import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";
import { applyTreasuryTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferCapacityAssessmentDurablyWithClient";
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
    "http://localhost/api/admin/control-center/treasury/transfers/test/execution-plans",
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
      reference: `AXPT-EXECUTION-PLAN-HTTP-${suffix}-${fixtureId}`,
      eventId: `execution-plan-http-transfer-created-${suffix}-${fixtureId}`,
      context: {
        commandId: `execution-plan-http-transfer-create-command-${suffix}-${fixtureId}`,
        actorId: `execution-plan-http-transfer-creator-${fixtureId}`,
        correlationId: `execution-plan-http-transfer-create-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T08:00:00.000Z"),
        idempotencyKey: `execution-plan-http-transfer-create-${suffix}-${fixtureId}`,
      },
      payload: {
        programId: `execution-plan-http-program-${fixtureId}`,
        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,
          programAccountId: `execution-plan-http-source-${fixtureId}`,
        },
        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,
          settlementEndpointId: `execution-plan-http-destination-${fixtureId}`,
        },
        requestedAmount: {
          amount: "1000000.00",
          currency: "USD",
        },
        destinationCurrency: "USD",
        purpose: `Execution Plan HTTP smoke ${suffix}.`,
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
    eventId: `execution-plan-http-review-event-${suffix}-${fixtureId}`,
    context: {
      commandId: `execution-plan-http-review-command-${suffix}-${fixtureId}`,
      actorId: `execution-plan-http-reviewer-${fixtureId}`,
      correlationId: `execution-plan-http-review-correlation-${suffix}-${fixtureId}`,
      requestedAt: new Date("2026-09-03T08:01:00.000Z"),
      idempotencyKey: `execution-plan-http-review-${suffix}-${fixtureId}`,
    },
    client,
  });

  const assessmentId = `execution-plan-http-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId,
      eventId: `execution-plan-http-authority-assessment-event-${suffix}-${fixtureId}`,
      context: {
        commandId: `execution-plan-http-authority-assessment-command-${suffix}-${fixtureId}`,
        actorId: `execution-plan-http-authority-assessor-${fixtureId}`,
        correlationId: `execution-plan-http-authority-assessment-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T08:02:00.000Z"),
        idempotencyKey: `execution-plan-http-authority-assessment-${suffix}-${fixtureId}`,
      },
      payload: {
        transferId,
        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
        evidenceArtifactIds: [
          `execution-plan-http-authority-evidence-${suffix}-${fixtureId}`,
        ],
        assessedAt: new Date("2026-09-03T08:01:30.000Z"),
      },
    },
    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,
    assessmentId,
    eventId: `execution-plan-http-authority-application-event-${suffix}-${fixtureId}`,
    context: {
      commandId: `execution-plan-http-authority-application-command-${suffix}-${fixtureId}`,
      actorId: `execution-plan-http-authority-applicator-${fixtureId}`,
      correlationId: `execution-plan-http-authority-application-correlation-${suffix}-${fixtureId}`,
      requestedAt: new Date("2026-09-03T08:03:00.000Z"),
      idempotencyKey: `execution-plan-http-authority-application-${suffix}-${fixtureId}`,
    },
    client,
  });
}

async function createCapacityAssessedTransfer(params: {
  transferId: string;
  capacityAssessmentId: string;
  suffix: string;
  fixtureId: string;
  client: TransactionClient;
}): Promise<void> {
  const { transferId, capacityAssessmentId, suffix, fixtureId, client } =
    params;

  await originateTransfer({
    transferId,
    suffix,
    fixtureId,
    client,
  });

  await authorizeTransfer({
    transferId,
    suffix,
    fixtureId,
    client,
  });

  await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId: capacityAssessmentId,
      eventId: `execution-plan-http-capacity-event-${suffix}-${fixtureId}`,
      context: {
        commandId: `execution-plan-http-capacity-command-${suffix}-${fixtureId}`,
        actorId: `execution-plan-http-capacity-assessor-${fixtureId}`,
        correlationId: `execution-plan-http-capacity-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T08:04:00.000Z"),
        idempotencyKey: `execution-plan-http-capacity-${suffix}-${fixtureId}`,
      },
      payload: {
        transferId,
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
            evidenceReferenceIds: [
              `execution-plan-http-source-evidence-${suffix}-${fixtureId}`,
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
              `execution-plan-http-rail-evidence-${suffix}-${fixtureId}`,
            ],
          },
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,
            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,
            evidenceReferenceIds: [],
          },
        ],
        assessedAt: new Date("2026-09-03T08:03:30.000Z"),
        notes: `Execution Plan HTTP Capacity fixture ${suffix}.`,
      },
    },
    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,
    assessmentId: capacityAssessmentId,
    eventId: `execution-plan-http-capacity-application-event-${suffix}-${fixtureId}`,
    context: {
      commandId: `execution-plan-http-capacity-application-command-${suffix}-${fixtureId}`,
      actorId: `execution-plan-http-capacity-applicator-${fixtureId}`,
      correlationId: `execution-plan-http-capacity-application-correlation-${suffix}-${fixtureId}`,
      requestedAt: new Date("2026-09-03T08:05:00.000Z"),
      idempotencyKey: `execution-plan-http-capacity-application-${suffix}-${fixtureId}`,
    },
    client,
  });
}

function createCanonicalBody(params: {
  capacityAssessmentId: string;
  fixtureId: string;
  suffix: string;
  plannedAmount?: string;
  trancheAmount?: string;
}) {
  const {
    capacityAssessmentId,
    fixtureId,
    suffix,
    plannedAmount = "600000.00",
    trancheAmount = "600000.00",
  } = params;

  return {
    capacityAssessmentId,
    plannedAmount: {
      amount: plannedAmount,
      currency: "USD",
    },
    destinationCurrency: "USD",
    tranches: [
      {
        trancheId: `execution-plan-http-tranche-${suffix}-${fixtureId}`,
        sequence: 1,
        amount: {
          amount: trancheAmount,
          currency: "USD",
        },
        executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,
        allocationId: `execution-plan-http-allocation-${suffix}-${fixtureId}`,
        settlementEndpointId: `execution-plan-http-destination-${fixtureId}`,
        purpose: `Execution Plan HTTP tranche ${suffix}.`,
      },
    ],
    plannedAt: "2026-09-03T08:06:00.000Z",
    notes: `Execution Plan HTTP smoke ${suffix}.`,
  };
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const actorId = `execution-plan-http-planner-${fixtureId}`;

  const targetTransferId = `execution-plan-http-target-transfer-${fixtureId}`;
  const targetCapacityAssessmentId = `execution-plan-http-target-capacity-${fixtureId}`;

  const foreignTransferId = `execution-plan-http-foreign-transfer-${fixtureId}`;
  const foreignCapacityAssessmentId = `execution-plan-http-foreign-capacity-${fixtureId}`;

  const wrongPostureTransferId = `execution-plan-http-wrong-posture-transfer-${fixtureId}`;
  const missingTransferId = `execution-plan-http-missing-transfer-${fixtureId}`;
  const missingCapacityAssessmentId = `execution-plan-http-missing-capacity-${fixtureId}`;

  const successfulIdempotencyKey = `execution-plan-http-success-${fixtureId}`;

  const principal = {
    userId: actorId,
  } as Principal;

  const canonicalBody = createCanonicalBody({
    capacityAssessmentId: targetCapacityAssessmentId,
    fixtureId,
    suffix: "canonical",
  });

  const transferIds = [
    targetTransferId,
    foreignTransferId,
    wrongPostureTransferId,
  ];

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createCapacityAssessedTransfer({
        transferId: targetTransferId,
        capacityAssessmentId: targetCapacityAssessmentId,
        suffix: "target",
        fixtureId,
        client: tx,
      });

      await createCapacityAssessedTransfer({
        transferId: foreignTransferId,
        capacityAssessmentId: foreignCapacityAssessmentId,
        suffix: "foreign",
        fixtureId,
        client: tx,
      });

      await originateTransfer({
        transferId: wrongPostureTransferId,
        suffix: "wrong-posture",
        fixtureId,
        client: tx,
      });

      await authorizeTransfer({
        transferId: wrongPostureTransferId,
        suffix: "wrong-posture",
        fixtureId,
        client: tx,
      });
    });

    /*
     * HTTP parsing boundary.
     */
    const missingTransferIdResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: "   ",
      request: createJsonRequest({
        body: canonicalBody,
        idempotencyKey: `execution-plan-http-empty-transfer-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(missingTransferIdResponse.status, 400);
    assert.equal(missingTransferIdResponse.body.ok, false);
    assert.equal(missingTransferIdResponse.body.error, "TRANSFER_ID_REQUIRED");

    const missingIdempotencyResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: canonicalBody,
      }),
      principal,
      prisma,
    });

    assert.equal(missingIdempotencyResponse.status, 400);
    assert.equal(missingIdempotencyResponse.body.ok, false);
    assert.equal(
      missingIdempotencyResponse.body.error,
      "IDEMPOTENCY_KEY_REQUIRED",
    );

    const malformedBodyResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: new Request(
        "http://localhost/api/admin/control-center/treasury/transfers/test/execution-plans",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `execution-plan-http-malformed-${fixtureId}`,
          },
          body: "{",
        },
      ),
      principal,
      prisma,
    });

    assert.equal(malformedBodyResponse.status, 400);
    assert.equal(malformedBodyResponse.body.ok, false);
    assert.equal(
      malformedBodyResponse.body.error,
      "EXECUTION_PLAN_BODY_INVALID",
    );

    const invalidAmountResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: {
          ...canonicalBody,
          plannedAmount: {
            amount: "",
            currency: "USD",
          },
        },
        idempotencyKey: `execution-plan-http-invalid-amount-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(invalidAmountResponse.status, 400);
    assert.equal(invalidAmountResponse.body.ok, false);
    assert.equal(
      invalidAmountResponse.body.error,
      "EXECUTION_PLAN_PLANNED_AMOUNT_INVALID",
    );

    /*
     * Canonical prerequisite boundaries.
     */
    const missingTransferResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: missingTransferId,
      request: createJsonRequest({
        body: canonicalBody,
        idempotencyKey: `execution-plan-http-missing-transfer-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(missingTransferResponse.status, 404);
    assert.equal(missingTransferResponse.body.ok, false);
    assert.equal(
      missingTransferResponse.body.error,
      "TREASURY_TRANSFER_NOT_FOUND",
    );

    const missingCapacityResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: createCanonicalBody({
          capacityAssessmentId: missingCapacityAssessmentId,
          fixtureId,
          suffix: "missing-capacity",
        }),
        idempotencyKey: `execution-plan-http-missing-capacity-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(missingCapacityResponse.status, 404);
    assert.equal(missingCapacityResponse.body.ok, false);
    assert.equal(
      missingCapacityResponse.body.error,
      "TREASURY_CAPACITY_ASSESSMENT_NOT_FOUND",
    );

    const wrongPostureResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: wrongPostureTransferId,
      request: createJsonRequest({
        body: createCanonicalBody({
          capacityAssessmentId: targetCapacityAssessmentId,
          fixtureId,
          suffix: "wrong-posture",
        }),
        idempotencyKey: `execution-plan-http-wrong-posture-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(wrongPostureResponse.status, 409);
    assert.equal(wrongPostureResponse.body.ok, false);
    assert.equal(
      wrongPostureResponse.body.error,
      "TREASURY_EXECUTION_PLAN_TRANSFER_STATUS_INVALID",
    );

    const mismatchedAssessmentResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: createCanonicalBody({
          capacityAssessmentId: foreignCapacityAssessmentId,
          fixtureId,
          suffix: "mismatched-capacity",
        }),
        idempotencyKey: `execution-plan-http-mismatched-capacity-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(mismatchedAssessmentResponse.status, 409);
    assert.equal(mismatchedAssessmentResponse.body.ok, false);
    assert.equal(
      mismatchedAssessmentResponse.body.error,
      "TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH",
    );

    /*
     * Treasury planning law.
     */
    const overCapacityResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: createCanonicalBody({
          capacityAssessmentId: targetCapacityAssessmentId,
          fixtureId,
          suffix: "over-capacity",
          plannedAmount: "600001.00",
          trancheAmount: "600001.00",
        }),
        idempotencyKey: `execution-plan-http-over-capacity-${fixtureId}`,
      }),
      principal,
      prisma,
    });

    assert.equal(overCapacityResponse.status, 409);
    assert.equal(overCapacityResponse.body.ok, false);
    assert.equal(
      overCapacityResponse.body.error,
      "TREASURY_EXECUTION_PLAN_INVALID",
    );

    /*
     * Canonical success.
     */
    const firstResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: canonicalBody,
        idempotencyKey: successfulIdempotencyKey,
      }),
      principal,
      prisma,
      generateIdentity: () => `canonical-${fixtureId}`,
      now: () => new Date("2026-09-03T08:07:00.000Z"),
    });

    assert.equal(firstResponse.status, 201);
    assert.equal(firstResponse.body.ok, true);

    if (!firstResponse.body.ok) {
      throw new Error("Expected successful Execution Plan recording response.");
    }

    assert.equal(firstResponse.body.disposition, "RECORDED");
    assert.equal(firstResponse.body.plan.transferId, targetTransferId);
    assert.equal(
      firstResponse.body.plan.capacityAssessmentId,
      targetCapacityAssessmentId,
    );
    assert.deepEqual(firstResponse.body.plan.plannedAmount, {
      amount: "600000.00",
      currency: "USD",
    });
    assert.equal(firstResponse.body.plan.destinationCurrency, "USD");
    assert.equal(firstResponse.body.plan.status, "RECORDED");
    assert.equal(firstResponse.body.plan.version, 1);
    assert.equal(firstResponse.body.plan.plannedByActorId, actorId);
    assert.equal(firstResponse.body.plan.tranches.length, 1);
    assert.equal(firstResponse.body.plan.tranches[0]?.status, "PLANNED");

    const canonicalPlanId = firstResponse.body.plan.id;

    /*
     * Exact retry must resolve through the command receipt to the original
     * canonical Plan even though fresh transport identities are proposed.
     */
    const replayResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: canonicalBody,
        idempotencyKey: successfulIdempotencyKey,
      }),
      principal,
      prisma,
      generateIdentity: () => `retry-${fixtureId}`,
      now: () => new Date("2026-09-03T08:08:00.000Z"),
    });

    assert.equal(replayResponse.status, 200);
    assert.equal(replayResponse.body.ok, true);

    if (!replayResponse.body.ok) {
      throw new Error("Expected successful Execution Plan replay response.");
    }

    assert.equal(replayResponse.body.disposition, "REPLAYED");
    assert.equal(replayResponse.body.plan.id, canonicalPlanId);
    assert.equal(replayResponse.body.plan.version, 1);

    /*
     * Same idempotency key + changed material request must collide.
     */
    const collisionResponse = await recordTreasuryExecutionPlanHttp({
      rawTransferId: targetTransferId,
      request: createJsonRequest({
        body: {
          ...canonicalBody,
          notes: "Materially changed Execution Plan request.",
        },
        idempotencyKey: successfulIdempotencyKey,
      }),
      principal,
      prisma,
      generateIdentity: () => `collision-${fixtureId}`,
      now: () => new Date("2026-09-03T08:09:00.000Z"),
    });

    assert.equal(collisionResponse.status, 409);
    assert.equal(collisionResponse.body.ok, false);
    assert.equal(
      collisionResponse.body.error,
      "TREASURY_EXECUTION_PLAN_IDEMPOTENCY_COLLISION",
    );

    /*
     * Durable truth inspection.
     */
    const targetTransferAfter =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
            aggregateId: targetTransferId,
          },
        },
      });

    assert(targetTransferAfter);
    assert.equal(
      targetTransferAfter.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );
    assert.equal(targetTransferAfter.version, 4);

    const planAggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
        aggregateId: canonicalPlanId,
      },
    });

    const planEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
        aggregateId: canonicalPlanId,
      },
    });

    const recordedPlanEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
        aggregateId: canonicalPlanId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey: successfulIdempotencyKey,
      },
    });

    assert.equal(planAggregateCount, 1);
    assert.equal(planEventCount, 1);
    assert.equal(recordedPlanEventCount, 1);
    assert.equal(receiptCount, 1);

    console.log(
      "✓ Control Center Treasury Execution Plan HTTP smoke test passed",
    );

    console.log({
      firstDisposition: firstResponse.body.disposition,
      replayDisposition: replayResponse.body.disposition,

      plan: {
        id: canonicalPlanId,
        status: firstResponse.body.plan.status,
        version: firstResponse.body.plan.version,
        plannedAmount: firstResponse.body.plan.plannedAmount,
        trancheStatus: firstResponse.body.plan.tranches[0]?.status,
      },

      targetTransfer: {
        id: targetTransferId,
        status: targetTransferAfter.status,
        version: targetTransferAfter.version,
      },

      durableState: {
        planAggregates: planAggregateCount,
        planEvents: planEventCount,
        recordedPlanEvents: recordedPlanEventCount,
        commandReceipts: receiptCount,
      },

      invariants: {
        emptyTransferIdRejected: true,
        idempotencyKeyRequired: true,
        malformedJsonRejected: true,
        malformedAmountRejectedAtHttpBoundary: true,
        missingTransferRejected: true,
        missingCapacityAssessmentRejected: true,
        wrongTransferPostureRejected: true,
        foreignTransferCapacityAssessmentRejected: true,
        executableCapacityCeilingEnforced: true,
        firstCanonicalRequestRecorded: true,
        exactRetryReplayed: true,
        replayReturnsOriginalCanonicalPlanIdentity: true,
        changedMaterialRequestRejected: true,
        exactlyOnePlanAggregatePersisted: true,
        exactlyOnePlanEventPersisted: true,
        exactlyOneCommandReceiptPersisted: true,
        recordingPlanDoesNotAdvanceTransfer: true,
      },
    });
  } finally {
    /*
     * Command receipts.
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
     * Execution Plans.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    /*
     * Capacity Assessments.
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
     * Authority Assessments.
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
     * Transfer fixtures.
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
