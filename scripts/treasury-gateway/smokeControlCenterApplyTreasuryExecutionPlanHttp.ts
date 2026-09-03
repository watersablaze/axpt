import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";
import { applyTreasuryExecutionPlanHttp } from "../../src/domains/control-center/treasury/applyTreasuryExecutionPlanHttp";
import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";
import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";
import { recordTreasuryExecutionPlanDurablyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/recordTreasuryExecutionPlanDurablyWithClient";
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

function createRequest(idempotencyKey?: string): Request {
  const headers = new Headers();

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers/test/execution-plans/test/apply",
    {
      method: "POST",
      headers,
    },
  );
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  assert(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `${label} must be an object`,
  );

  return value as Record<string, unknown>;
}

async function createCapacityAssessedTransfer(params: {
  transferId: string;
  capacityAssessmentId: string;
  fixtureId: string;
  suffix: string;
  client: TransactionClient;
}): Promise<void> {
  const { transferId, capacityAssessmentId, fixtureId, suffix, client } =
    params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,
      reference: `AXPT-PLAN-HTTP-APPLY-${suffix}-${fixtureId}`,
      eventId: `plan-http-apply-created-${suffix}-${fixtureId}`,
      context: {
        commandId: `plan-http-apply-create-command-${suffix}-${fixtureId}`,
        actorId: `plan-http-apply-creator-${fixtureId}`,
        correlationId: `plan-http-apply-create-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T09:00:00.000Z"),
        idempotencyKey: `plan-http-apply-create-${suffix}-${fixtureId}`,
      },
      payload: {
        programId: `plan-http-apply-program-${fixtureId}`,
        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,
          programAccountId: `plan-http-apply-source-${fixtureId}`,
        },
        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,
          settlementEndpointId: `plan-http-apply-destination-${fixtureId}`,
        },
        requestedAmount: {
          amount: "1000000.00",
          currency: "USD",
        },
        destinationCurrency: "USD",
        purpose: `Execution Plan HTTP application ${suffix}.`,
      },
    },
    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,
    eventId: `plan-http-apply-review-event-${suffix}-${fixtureId}`,
    context: {
      commandId: `plan-http-apply-review-command-${suffix}-${fixtureId}`,
      actorId: `plan-http-apply-reviewer-${fixtureId}`,
      correlationId: `plan-http-apply-review-correlation-${suffix}-${fixtureId}`,
      requestedAt: new Date("2026-09-03T09:01:00.000Z"),
      idempotencyKey: `plan-http-apply-review-${suffix}-${fixtureId}`,
    },
    client,
  });

  const authorityAssessmentId = `plan-http-apply-authority-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,
      eventId: `plan-http-apply-authority-event-${suffix}-${fixtureId}`,
      context: {
        commandId: `plan-http-apply-authority-command-${suffix}-${fixtureId}`,
        actorId: `plan-http-apply-authority-assessor-${fixtureId}`,
        correlationId: `plan-http-apply-authority-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T09:02:00.000Z"),
        idempotencyKey: `plan-http-apply-authority-${suffix}-${fixtureId}`,
      },
      payload: {
        transferId,
        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
        evidenceArtifactIds: [
          `plan-http-apply-authority-evidence-${suffix}-${fixtureId}`,
        ],
        assessedAt: new Date("2026-09-03T09:01:30.000Z"),
      },
    },
    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,
    assessmentId: authorityAssessmentId,
    eventId: `plan-http-apply-authority-application-event-${suffix}-${fixtureId}`,
    context: {
      commandId: `plan-http-apply-authority-application-command-${suffix}-${fixtureId}`,
      actorId: `plan-http-apply-authority-applicator-${fixtureId}`,
      correlationId: `plan-http-apply-authority-application-correlation-${suffix}-${fixtureId}`,
      requestedAt: new Date("2026-09-03T09:03:00.000Z"),
      idempotencyKey: `plan-http-apply-authority-application-${suffix}-${fixtureId}`,
    },
    client,
  });

  await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId: capacityAssessmentId,
      eventId: `plan-http-apply-capacity-event-${suffix}-${fixtureId}`,
      context: {
        commandId: `plan-http-apply-capacity-command-${suffix}-${fixtureId}`,
        actorId: `plan-http-apply-capacity-assessor-${fixtureId}`,
        correlationId: `plan-http-apply-capacity-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T09:04:00.000Z"),
        idempotencyKey: `plan-http-apply-capacity-${suffix}-${fixtureId}`,
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
              `plan-http-apply-source-evidence-${suffix}-${fixtureId}`,
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
              `plan-http-apply-rail-evidence-${suffix}-${fixtureId}`,
            ],
          },
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,
            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,
            evidenceReferenceIds: [],
          },
        ],
        assessedAt: new Date("2026-09-03T09:03:30.000Z"),
      },
    },
    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,
    assessmentId: capacityAssessmentId,
    eventId: `plan-http-apply-capacity-application-event-${suffix}-${fixtureId}`,
    context: {
      commandId: `plan-http-apply-capacity-application-command-${suffix}-${fixtureId}`,
      actorId: `plan-http-apply-capacity-applicator-${fixtureId}`,
      correlationId: `plan-http-apply-capacity-application-correlation-${suffix}-${fixtureId}`,
      requestedAt: new Date("2026-09-03T09:05:00.000Z"),
      idempotencyKey: `plan-http-apply-capacity-application-${suffix}-${fixtureId}`,
    },
    client,
  });
}

async function createPlan(params: {
  transferId: string;
  capacityAssessmentId: string;
  planId: string;
  fixtureId: string;
  suffix: string;
  client: TransactionClient;
}): Promise<void> {
  const {
    transferId,
    capacityAssessmentId,
    planId,
    fixtureId,
    suffix,
    client,
  } = params;

  await recordTreasuryExecutionPlanDurablyWithClient({
    request: {
      planId,
      eventId: `plan-http-apply-plan-event-${suffix}-${fixtureId}`,
      context: {
        commandId: `plan-http-apply-plan-command-${suffix}-${fixtureId}`,
        actorId: `plan-http-apply-planner-${fixtureId}`,
        correlationId: `plan-http-apply-plan-correlation-${suffix}-${fixtureId}`,
        requestedAt: new Date("2026-09-03T09:06:00.000Z"),
        idempotencyKey: `plan-http-apply-plan-${suffix}-${fixtureId}`,
      },
      payload: {
        transferId,
        capacityAssessmentId,
        plannedAmount: {
          amount: "600000.00",
          currency: "USD",
        },
        destinationCurrency: "USD",
        tranches: [
          {
            trancheId: `plan-http-apply-tranche-${suffix}-${fixtureId}`,
            sequence: 1,
            amount: {
              amount: "600000.00",
              currency: "USD",
            },
            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,
            allocationId: `plan-http-apply-allocation-${suffix}-${fixtureId}`,
            settlementEndpointId: `plan-http-apply-destination-${fixtureId}`,
            purpose: `Execution Plan HTTP application tranche ${suffix}.`,
          },
        ],
        plannedAt: new Date("2026-09-03T09:05:30.000Z"),
      },
    },
    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const actorId = `plan-http-apply-operator-${fixtureId}`;

  const transferId = `plan-http-apply-transfer-${fixtureId}`;
  const capacityAssessmentId = `plan-http-apply-capacity-${fixtureId}`;
  const planId = `plan-http-apply-plan-${fixtureId}`;

  const foreignTransferId = `plan-http-apply-foreign-transfer-${fixtureId}`;
  const foreignCapacityAssessmentId = `plan-http-apply-foreign-capacity-${fixtureId}`;
  const foreignPlanId = `plan-http-apply-foreign-plan-${fixtureId}`;

  const missingTransferId = `plan-http-apply-missing-transfer-${fixtureId}`;
  const missingPlanId = `plan-http-apply-missing-plan-${fixtureId}`;

  const idempotencyKey = `plan-http-apply-success-${fixtureId}`;

  const principal = {
    userId: actorId,
  } as Principal;

  const transferIds = [transferId, foreignTransferId];

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createCapacityAssessedTransfer({
        transferId,
        capacityAssessmentId,
        fixtureId,
        suffix: "target",
        client: tx,
      });

      await createPlan({
        transferId,
        capacityAssessmentId,
        planId,
        fixtureId,
        suffix: "target",
        client: tx,
      });

      await createCapacityAssessedTransfer({
        transferId: foreignTransferId,
        capacityAssessmentId: foreignCapacityAssessmentId,
        fixtureId,
        suffix: "foreign",
        client: tx,
      });

      await createPlan({
        transferId: foreignTransferId,
        capacityAssessmentId: foreignCapacityAssessmentId,
        planId: foreignPlanId,
        fixtureId,
        suffix: "foreign",
        client: tx,
      });
    });

    /*
     * HTTP identity boundary.
     */
    const emptyTransferResponse = await applyTreasuryExecutionPlanHttp({
      rawTransferId: "   ",
      rawPlanId: planId,
      request: createRequest(`plan-http-apply-empty-transfer-${fixtureId}`),
      principal,
      prisma,
    });

    assert.equal(emptyTransferResponse.status, 400);
    assert.equal(emptyTransferResponse.body.ok, false);
    assert.equal(emptyTransferResponse.body.error, "TRANSFER_ID_REQUIRED");

    const emptyPlanResponse = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: "   ",
      request: createRequest(`plan-http-apply-empty-plan-${fixtureId}`),
      principal,
      prisma,
    });

    assert.equal(emptyPlanResponse.status, 400);
    assert.equal(emptyPlanResponse.body.ok, false);
    assert.equal(emptyPlanResponse.body.error, "EXECUTION_PLAN_ID_REQUIRED");

    const missingIdempotencyResponse = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: planId,
      request: createRequest(),
      principal,
      prisma,
    });

    assert.equal(missingIdempotencyResponse.status, 400);
    assert.equal(missingIdempotencyResponse.body.ok, false);
    assert.equal(
      missingIdempotencyResponse.body.error,
      "IDEMPOTENCY_KEY_REQUIRED",
    );

    /*
     * Canonical identity boundary.
     */
    const missingTransferResponse = await applyTreasuryExecutionPlanHttp({
      rawTransferId: missingTransferId,
      rawPlanId: planId,
      request: createRequest(`plan-http-apply-missing-transfer-${fixtureId}`),
      principal,
      prisma,
    });

    assert.equal(missingTransferResponse.status, 404);
    assert.equal(missingTransferResponse.body.ok, false);
    assert.equal(
      missingTransferResponse.body.error,
      "TREASURY_TRANSFER_NOT_FOUND",
    );

    const missingPlanResponse = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: missingPlanId,
      request: createRequest(`plan-http-apply-missing-plan-${fixtureId}`),
      principal,
      prisma,
    });

    assert.equal(missingPlanResponse.status, 404);
    assert.equal(missingPlanResponse.body.ok, false);
    assert.equal(
      missingPlanResponse.body.error,
      "TREASURY_EXECUTION_PLAN_NOT_FOUND",
    );

    const foreignPlanResponse = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: foreignPlanId,
      request: createRequest(`plan-http-apply-foreign-plan-${fixtureId}`),
      principal,
      prisma,
    });

    assert.equal(foreignPlanResponse.status, 409);
    assert.equal(foreignPlanResponse.body.ok, false);
    assert.equal(
      foreignPlanResponse.body.error,
      "TREASURY_EXECUTION_PLAN_TARGET_MISMATCH",
    );

    /*
     * Canonical application.
     */
    const first = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: planId,
      request: createRequest(idempotencyKey),
      principal,
      prisma,
      generateIdentity: () => `first-${fixtureId}`,
      now: () => new Date("2026-09-03T09:07:00.000Z"),
    });

    assert.equal(first.status, 200);
    assert.equal(first.body.ok, true);
    assert.equal(first.body.disposition, "APPLIED");

    const transferAfterFirst = await prisma.treasuryGatewayAggregate.findUnique(
      {
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
            aggregateId: transferId,
          },
        },
      },
    );

    assert(transferAfterFirst);
    assert.equal(transferAfterFirst.status, TREASURY_TRANSFER_STATUS.PLANNED);
    assert.equal(transferAfterFirst.version, 5);

    /*
     * Exact retry.
     */
    const replay = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: planId,
      request: createRequest(idempotencyKey),
      principal,
      prisma,
      generateIdentity: () => `retry-${fixtureId}`,
      now: () => new Date("2026-09-03T09:08:00.000Z"),
    });

    assert.equal(replay.status, 200);
    assert.equal(replay.body.ok, true);
    assert.equal(replay.body.disposition, "REPLAYED");
    const replayTransfer = requireRecord(
      replay.body.transfer,
      "replay.body.transfer",
    );

    assert.equal(replayTransfer.id, transferId);

    assert.equal(replayTransfer.status, TREASURY_TRANSFER_STATUS.PLANNED);

    assert.equal(replayTransfer.version, 5);

    /*
     * Same key, changed material Plan identity.
     */
    const collision = await applyTreasuryExecutionPlanHttp({
      rawTransferId: transferId,
      rawPlanId: foreignPlanId,
      request: createRequest(idempotencyKey),
      principal,
      prisma,
      generateIdentity: () => `collision-${fixtureId}`,
      now: () => new Date("2026-09-03T09:09:00.000Z"),
    });

    assert.equal(collision.status, 409);
    assert.equal(collision.body.ok, false);
    assert.equal(
      collision.body.error,
      "TREASURY_EXECUTION_PLAN_APPLICATION_IDEMPOTENCY_COLLISION",
    );

    /*
     * Durable truth.
     */
    const transferAfterReplay =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
            aggregateId: transferId,
          },
        },
      });

    assert(transferAfterReplay);
    assert.equal(transferAfterReplay.status, TREASURY_TRANSFER_STATUS.PLANNED);
    assert.equal(transferAfterReplay.version, 5);

    const transferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
        aggregateId: transferId,
      },
    });

    const plannedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
        aggregateId: transferId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(transferEventCount, 5);
    assert.equal(plannedEventCount, 1);
    assert.equal(receiptCount, 1);

    console.log(
      "✓ Control Center Treasury Execution Plan application HTTP smoke test passed",
    );

    console.log({
      firstDisposition: first.body.disposition,
      replayDisposition: replay.body.disposition,

      targetTransfer: {
        id: transferId,
        status: transferAfterReplay.status,
        version: transferAfterReplay.version,
      },

      durableState: {
        transferEvents: transferEventCount,
        plannedEvents: plannedEventCount,
        applicationReceipts: receiptCount,
      },

      invariants: {
        transferIdRequired: true,
        executionPlanIdRequired: true,
        idempotencyKeyRequired: true,
        canonicalTransferRequired: true,
        canonicalExecutionPlanRequired: true,
        foreignPlanRejected: true,
        firstApplicationApplied: true,
        transferAdvancesFromCapacityAssessedToPlanned: true,
        transferAdvancesFromVersionFourToFive: true,
        exactRetryReplayed: true,
        exactRetryReturnsCanonicalTransfer: true,
        exactRetryDoesNotAdvanceVersion: true,
        exactRetryAppendsNoDuplicateTransferEvent: true,
        exactRetryAppendsNoDuplicatePlanningEvent: true,
        changedPlanWithSameKeyRejected: true,
        exactlyOneApplicationReceiptPersisted: true,
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
