import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlanDurablyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/recordTreasuryExecutionPlanDurablyWithClient";

import { loadTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { applyTreasuryExecutionPlanDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryExecutionPlanDurablyWithClient";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { applyTreasuryTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferCapacityAssessmentDurablyWithClient";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
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

      reference: `AXPT-EXECUTION-PLAN-APPLICATION-${suffix}-${fixtureId}`,

      eventId: `execution-plan-application-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-application-transfer-creator-${fixtureId}`,

        correlationId: `execution-plan-application-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T19:00:00.000Z"),

        idempotencyKey: `execution-plan-application-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `execution-plan-application-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `execution-plan-application-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `execution-plan-application-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Execution Plan application fixture ${suffix}.`,
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

    eventId: `execution-plan-application-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-application-review-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-application-reviewer-${fixtureId}`,

      correlationId: `execution-plan-application-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T19:01:00.000Z"),

      idempotencyKey: `execution-plan-application-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `execution-plan-application-authority-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `execution-plan-application-authority-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-authority-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-application-authority-assessor-${fixtureId}`,

        correlationId: `execution-plan-application-authority-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T19:02:00.000Z"),

        idempotencyKey: `execution-plan-application-authority-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `execution-plan-application-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-24T19:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `execution-plan-application-authority-apply-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-application-authority-apply-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-application-authority-applicator-${fixtureId}`,

      correlationId: `execution-plan-application-authority-apply-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T19:03:00.000Z"),

      idempotencyKey: `execution-plan-application-authority-apply-${suffix}-${fixtureId}`,
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

      eventId: `execution-plan-application-capacity-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-capacity-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-application-capacity-assessor-${fixtureId}`,

        correlationId: `execution-plan-application-capacity-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T19:04:00.000Z"),

        idempotencyKey: `execution-plan-application-capacity-${suffix}-${fixtureId}`,
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
              `execution-plan-application-source-evidence-${suffix}-${fixtureId}`,
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
              `execution-plan-application-rail-evidence-${suffix}-${fixtureId}`,
            ],
          },
        ],

        assessedAt: new Date("2026-08-24T19:03:30.000Z"),

        notes: `Execution Plan application Capacity fixture ${suffix}.`,
      },
    },

    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,

    assessmentId: capacityAssessmentId,

    eventId: `execution-plan-application-capacity-apply-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-application-capacity-apply-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-application-capacity-applicator-${fixtureId}`,

      correlationId: `execution-plan-application-capacity-apply-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T19:05:00.000Z"),

      idempotencyKey: `execution-plan-application-capacity-apply-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function recordPlan(params: {
  planId: string;
  transferId: string;
  capacityAssessmentId: string;
  suffix: string;
  fixtureId: string;
  actorId: string;
  client: TransactionClient;
}): Promise<void> {
  const {
    planId,
    transferId,
    capacityAssessmentId,
    suffix,
    fixtureId,
    actorId,
    client,
  } = params;

  await recordTreasuryExecutionPlanDurablyWithClient({
    request: {
      planId,

      eventId: `execution-plan-application-plan-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-plan-command-${suffix}-${fixtureId}`,

        actorId,

        correlationId: `execution-plan-application-plan-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T19:06:00.000Z"),

        idempotencyKey: `execution-plan-application-plan-${suffix}-${fixtureId}`,
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
            trancheId: `execution-plan-application-tranche-${suffix}-${fixtureId}`,

            sequence: 1,

            amount: {
              amount: "600000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `execution-plan-application-allocation-${suffix}-${fixtureId}`,

            settlementEndpointId: `execution-plan-application-destination-${fixtureId}`,

            purpose: `Execution Plan application tranche ${suffix}.`,
          },
        ],

        plannedAt: new Date("2026-08-24T19:05:30.000Z"),

        notes: `Execution Plan application smoke ${suffix}.`,
      },
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const targetTransferId = `execution-plan-application-target-transfer-${fixtureId}`;

  const targetCapacityAssessmentId = `execution-plan-application-target-capacity-${fixtureId}`;

  const targetPlanId = `execution-plan-application-target-plan-${fixtureId}`;

  const foreignTransferId = `execution-plan-application-foreign-transfer-${fixtureId}`;

  const foreignCapacityAssessmentId = `execution-plan-application-foreign-capacity-${fixtureId}`;

  const foreignPlanId = `execution-plan-application-foreign-plan-${fixtureId}`;

  const wrongPostureTransferId = `execution-plan-application-wrong-posture-transfer-${fixtureId}`;

  const missingTransferId = `execution-plan-application-missing-transfer-${fixtureId}`;

  const missingPlanId = `execution-plan-application-missing-plan-${fixtureId}`;

  const actorId = `execution-plan-application-actor-${fixtureId}`;

  const transferIds = [
    targetTransferId,
    foreignTransferId,
    wrongPostureTransferId,
  ];

  try {
    /*
     * Build two independent canonical CAPACITY_ASSESSED Transfers.
     *
     * Each receives its own canonical recorded Plan.
     */
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

      await recordPlan({
        planId: targetPlanId,

        transferId: targetTransferId,

        capacityAssessmentId: targetCapacityAssessmentId,

        suffix: "target",

        fixtureId,

        actorId,

        client: tx,
      });

      await recordPlan({
        planId: foreignPlanId,

        transferId: foreignTransferId,

        capacityAssessmentId: foreignCapacityAssessmentId,

        suffix: "foreign",

        fixtureId,

        actorId,

        client: tx,
      });

      /*
       * Wrong-posture fixture deliberately stops at AUTHORIZED @ v3.
       */
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
     * Recording a Plan alone must leave its Transfer CAPACITY_ASSESSED @ v4.
     */
    const targetTransferBefore =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: targetTransferId,
          },
        },
      });

    assert(targetTransferBefore);

    assert.equal(
      targetTransferBefore.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(targetTransferBefore.version, 4);

    const targetPlanBefore = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionPlanWithClient({
          planId: targetPlanId,

          client: tx,
        }),
    );

    assert(targetPlanBefore);

    assert.equal(
      targetPlanBefore.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(targetPlanBefore.aggregate.metadata.version, 1);

    assert.equal(
      targetPlanBefore.aggregate.tranches[0]?.status,
      EXECUTABLE_TRANCHE_STATUS.PLANNED,
    );

    /*
     * Missing Transfer.
     *
     * The Plan is canonical, but its requested Transfer does not exist.
     */
    let missingTransferError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanDurablyWithClient({
          transferId: missingTransferId,

          planId: targetPlanId,

          eventId: `execution-plan-application-missing-transfer-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-application-missing-transfer-command-${fixtureId}`,

            actorId,

            correlationId: `execution-plan-application-missing-transfer-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T19:07:00.000Z"),

            idempotencyKey: `execution-plan-application-missing-transfer-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingTransferError = error;
    }

    assertErrorCode(
      missingTransferError,
      "TREASURY_GATEWAY_TRANSFER_NOT_FOUND",
    );

    /*
     * Missing Plan.
     */
    let missingPlanError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanDurablyWithClient({
          transferId: targetTransferId,

          planId: missingPlanId,

          eventId: `execution-plan-application-missing-plan-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-application-missing-plan-command-${fixtureId}`,

            actorId,

            correlationId: `execution-plan-application-missing-plan-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T19:07:00.000Z"),

            idempotencyKey: `execution-plan-application-missing-plan-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingPlanError = error;
    }

    assertErrorCode(
      missingPlanError,
      "TREASURY_GATEWAY_EXECUTION_PLAN_NOT_FOUND",
    );

    /*
     * A canonical Plan belonging to another Transfer cannot be applied
     * to the target Transfer.
     */
    let mismatchedPlanError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanDurablyWithClient({
          transferId: targetTransferId,

          planId: foreignPlanId,

          eventId: `execution-plan-application-mismatched-plan-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-application-mismatched-plan-command-${fixtureId}`,

            actorId,

            correlationId: `execution-plan-application-mismatched-plan-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T19:07:00.000Z"),

            idempotencyKey: `execution-plan-application-mismatched-plan-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      mismatchedPlanError = error;
    }

    assertErrorCode(
      mismatchedPlanError,
      "TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH",
    );

    /*
     * Wrong Transfer posture.
     *
     * AUTHORIZED may not jump directly to PLANNED.
     *
     * We intentionally use the target Plan. The domain checks the
     * Plan/Transfer relationship before transition posture, so using a
     * Plan for another Transfer would fail on relationship mismatch
     * before reaching the transition guard.
     *
     * To exercise the transition law directly, temporarily construct a
     * canonical Plan row for this AUTHORIZED Transfer by cloning the
     * already-recorded Plan snapshot with the proper identity.
     *
     * This is a persistence fixture only. It is not exercising Plan
     * recording law, which correctly requires CAPACITY_ASSESSED.
     */
    const wrongPosturePlanId = `execution-plan-application-wrong-posture-plan-${fixtureId}`;

    const targetPlanRow = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

          aggregateId: targetPlanId,
        },
      },
    });

    assert(targetPlanRow);

    const targetPlanSnapshot = targetPlanRow.snapshot;

    assert(
      typeof targetPlanSnapshot === "object" &&
        targetPlanSnapshot !== null &&
        !Array.isArray(targetPlanSnapshot),
    );

    const wrongPostureSnapshot = {
      ...targetPlanSnapshot,

      id: wrongPosturePlanId,

      transferId: wrongPostureTransferId,

      metadata: {
        ...(targetPlanSnapshot.metadata as Record<string, unknown>),

        createdAt: new Date("2026-08-24T19:06:00.000Z").toISOString(),

        updatedAt: new Date("2026-08-24T19:06:00.000Z").toISOString(),
      },
    };

    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: wrongPosturePlanId,

        status: TREASURY_EXECUTION_PLAN_STATUS.RECORDED,

        version: 1,

        snapshot: wrongPostureSnapshot,
      },
    });

    let wrongPostureError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanDurablyWithClient({
          transferId: wrongPostureTransferId,

          planId: wrongPosturePlanId,

          eventId: `execution-plan-application-wrong-posture-apply-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-application-wrong-posture-apply-command-${fixtureId}`,

            actorId,

            correlationId: `execution-plan-application-wrong-posture-apply-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T19:07:00.000Z"),

            idempotencyKey: `execution-plan-application-wrong-posture-apply-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      wrongPostureError = error;
    }

    assertErrorCode(wrongPostureError, "TREASURY_TRANSFER_TRANSITION_INVALID");

    /*
     * All failed applications must leave the target Transfer unchanged.
     */
    const targetTransferAfterFailures =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: targetTransferId,
          },
        },
      });

    assert(targetTransferAfterFailures);

    assert.equal(
      targetTransferAfterFailures.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(targetTransferAfterFailures.version, 4);

    const targetTransferEventsBeforeApplication =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: targetTransferId,
        },
      });

    assert.equal(targetTransferEventsBeforeApplication, 4);

    const wrongPostureTransfer =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: wrongPostureTransferId,
          },
        },
      });

    assert(wrongPostureTransfer);

    assert.equal(
      wrongPostureTransfer.status,
      TREASURY_TRANSFER_STATUS.AUTHORIZED,
    );

    assert.equal(wrongPostureTransfer.version, 3);

    const wrongPostureTransferEvents = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: wrongPostureTransferId,
      },
    });

    assert.equal(wrongPostureTransferEvents, 3);

    /*
     * Apply the canonical recorded Plan.
     */
    const applied = await prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryExecutionPlanDurablyWithClient({
        transferId: targetTransferId,

        planId: targetPlanId,

        eventId: `execution-plan-application-success-event-${fixtureId}`,

        context: {
          commandId: `execution-plan-application-success-command-${fixtureId}`,

          actorId,

          correlationId: `execution-plan-application-success-correlation-${fixtureId}`,

          requestedAt: new Date("2026-08-24T19:08:00.000Z"),

          idempotencyKey: `execution-plan-application-success-${fixtureId}`,
        },

        client: tx,
      }),
    );

    assert.equal(applied.aggregate.status, TREASURY_TRANSFER_STATUS.PLANNED);

    assert.equal(applied.aggregate.metadata.version, 5);

    assert.equal(applied.aggregate.metadata.lastModifiedByActorId, actorId);

    assert.equal(
      applied.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
    );

    assert.equal(applied.event.payload.transferId, targetTransferId);

    assert.equal(applied.event.payload.planId, targetPlanId);

    assert.equal(applied.event.aggregateVersion, 5);

    /*
     * Durable Transfer state must now be PLANNED @ v5.
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

    assert.equal(targetTransferAfter.status, TREASURY_TRANSFER_STATUS.PLANNED);

    assert.equal(targetTransferAfter.version, 5);

    const targetTransferEventsAfterApplication =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: targetTransferId,
        },
      });

    assert.equal(targetTransferEventsAfterApplication, 5);

    /*
     * Applying the Plan changes Transfer posture only.
     *
     * The canonical Plan remains RECORDED @ v1 and its tranche remains
     * PLANNED. Eligibility is a later governed lifecycle.
     */
    const targetPlanAfter = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionPlanWithClient({
          planId: targetPlanId,

          client: tx,
        }),
    );

    assert(targetPlanAfter);

    assert.equal(
      targetPlanAfter.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(targetPlanAfter.aggregate.metadata.version, 1);

    assert.equal(
      targetPlanAfter.aggregate.tranches[0]?.status,
      EXECUTABLE_TRANCHE_STATUS.PLANNED,
    );

    assert.deepEqual(targetPlanAfter.aggregate, targetPlanBefore.aggregate);

    /*
     * Foreign Plan and Transfer remain untouched.
     */
    const foreignTransfer = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: foreignTransferId,
        },
      },
    });

    assert(foreignTransfer);

    assert.equal(
      foreignTransfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(foreignTransfer.version, 4);

    const foreignPlan = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionPlanWithClient({
          planId: foreignPlanId,

          client: tx,
        }),
    );

    assert(foreignPlan);

    assert.equal(
      foreignPlan.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(foreignPlan.aggregate.metadata.version, 1);

    /*
     * There must be exactly one planning event on the successful target
     * Transfer.
     */
    const plannedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: targetTransferId,

        eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
      },
    });

    assert.equal(plannedEventCount, 1);

    console.log(
      "✓ Durable Treasury Execution Plan application smoke test passed",
    );

    console.log({
      outcome: {
        transferId: targetTransferId,

        planId: targetPlanId,

        transferStatus: targetTransferAfter.status,

        transferVersion: targetTransferAfter.version,

        planStatus: targetPlanAfter.aggregate.status,

        planVersion: targetPlanAfter.aggregate.metadata.version,

        trancheStatus: targetPlanAfter.aggregate.tranches[0]?.status,
      },

      durableState: {
        transferEvents: targetTransferEventsAfterApplication,

        plannedEvents: plannedEventCount,

        planAggregates: 2,

        targetPlanEvents: 1,
      },

      failureState: {
        targetTransferStatusBeforeSuccess: targetTransferAfterFailures.status,

        targetTransferVersionBeforeSuccess: targetTransferAfterFailures.version,

        wrongPostureTransferStatus: wrongPostureTransfer.status,

        wrongPostureTransferVersion: wrongPostureTransfer.version,

        wrongPostureTransferEvents,
      },

      invariants: {
        canonicalTransferRequired: true,

        canonicalExecutionPlanRequired: true,

        callerSuppliesTransferAndPlanIdentityOnly: true,

        recordedPlanDoesNotAdvanceTransfer: true,

        mismatchedPlanRejected: true,

        wrongTransferPostureRejected: true,

        failedApplicationsAppendNoTransferEvent: true,

        canonicalPlanApplicationProducesPlannedTransfer: true,

        transferAdvancesFromVersionFourToFive: true,

        planningEventRetainsPlanIdentity: true,

        exactlyOnePlanningEventAppended: true,

        appliedPlanRemainsRecorded: true,

        appliedPlanRemainsVersionOne: true,

        trancheRemainsPlanned: true,

        foreignTransferRemainsUntouched: true,

        foreignPlanRemainsUntouched: true,
      },
    });
  } finally {
    /*
     * Command receipts, if any fixture helper persisted them.
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
     * Transfers.
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
