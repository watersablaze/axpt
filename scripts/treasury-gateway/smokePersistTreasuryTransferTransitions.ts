import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import { executeDurableTreasuryTransferTransitionWithClient } from "../../src/domains/treasury/gateway/transfers/application/executeDurableTreasuryTransferTransitionWithClient";

import { applyTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/transfers/applyTreasuryExecutionPlan";

import { applyTreasuryTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";

import { applyTreasuryTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferCapacityAssessment";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import {
  TREASURY_TRANSFER_LOCATION_KIND,
  type TreasuryTransfer,
} from "../../src/domains/treasury/gateway/transfers/contracts";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { loadTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/loadTreasuryTransferWithClient";

import { persistNewTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/persistNewTreasuryTransferWithClient";

import { persistTreasuryTransferTransitionWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/persistTreasuryTransferTransitionWithClient";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

function assertVersionAndStatus(
  aggregate: TreasuryTransfer,
  version: number,
  status: TreasuryTransfer["status"],
): void {
  assert.equal(aggregate.metadata.version, version);

  assert.equal(aggregate.status, status);
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-transfer-transition-${fixtureId}`;

  const authorityAssessmentId = `smoke-transfer-authority-assessment-${fixtureId}`;

  const capacityAssessmentId = `smoke-transfer-capacity-assessment-${fixtureId}`;

  const planId = `smoke-transfer-plan-${fixtureId}`;

  const trancheId = `smoke-transfer-tranche-${fixtureId}`;

  const correlationId = `smoke-transfer-transition-correlation-${fixtureId}`;

  const createdContext = {
    commandId: `smoke-transfer-create-command-${fixtureId}`,

    actorId: `smoke-transfer-requestor-${fixtureId}`,

    correlationId,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-create-${fixtureId}`,
  };

  const created = createTreasuryTransfer({
    transferId,

    reference: `SMOKE-TRANSFER-TRANSITION-${fixtureId}`,

    command: {
      context: createdContext,

      payload: {
        programId: `smoke-transfer-program-${fixtureId}`,

        instructionId: `smoke-transfer-instruction-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY,

          treasuryPartyId: `smoke-transfer-party-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-transfer-endpoint-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "EUR",

        purpose:
          "Comprehensive Treasury Transfer transition persistence smoke test",
      },
    },
  });

  const reviewContext = {
    ...createdContext,

    commandId: `smoke-transfer-review-command-${fixtureId}`,

    actorId: `smoke-transfer-review-operator-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-review-${fixtureId}`,
  };

  const authorityContext = {
    ...createdContext,

    commandId: `smoke-transfer-authority-command-${fixtureId}`,

    actorId: `smoke-transfer-authority-operator-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-authority-${fixtureId}`,
  };

  const authorityAssessment = recordTransferAuthorityAssessment({
    assessmentId: authorityAssessmentId,

    command: {
      context: authorityContext,

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        instructionId: created.aggregate.instructionId,

        authorityGrantId: `smoke-transfer-authority-grant-${fixtureId}`,

        evidenceArtifactIds: [`smoke-transfer-authority-evidence-${fixtureId}`],

        assessedAt: new Date(),

        notes: "Authority confirmed for transition smoke test",
      },
    },
  });

  const capacityContext = {
    ...createdContext,

    commandId: `smoke-transfer-capacity-command-${fixtureId}`,

    actorId: `smoke-transfer-capacity-operator-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-capacity-${fixtureId}`,
  };

  const capacityAssessment = recordTransferCapacityAssessment({
    assessmentId: capacityAssessmentId,

    command: {
      context: capacityContext,

      payload: {
        transferId,

        requestedAmount: created.aggregate.requestedAmount,

        constraints: [
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "1000000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [
              `smoke-transfer-capacity-evidence-${fixtureId}`,
            ],
          },
        ],

        assessedAt: new Date(),

        notes: "Executable capacity confirmed",
      },
    },
  });

  assert(
    capacityAssessment.aggregate.executableNow,
    "Expected executable transfer capacity",
  );

  const planContext = {
    ...createdContext,

    commandId: `smoke-transfer-plan-command-${fixtureId}`,

    actorId: `smoke-transfer-planner-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-plan-${fixtureId}`,
  };

  const recordedPlan = recordTreasuryExecutionPlan({
    planId,

    capacityAssessment: capacityAssessment.aggregate,

    command: {
      context: planContext,

      payload: {
        transferId,

        capacityAssessmentId,

        plannedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "EUR",

        tranches: [
          {
            trancheId,

            sequence: 1,

            amount: {
              amount: "1000000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `smoke-transfer-allocation-${fixtureId}`,

            instructionId: created.aggregate.instructionId,

            beneficiaryProfileId: `smoke-transfer-beneficiary-${fixtureId}`,

            settlementEndpointId: `smoke-transfer-endpoint-${fixtureId}`,

            purpose: "Execute comprehensively tested Treasury Transfer",
          },
        ],

        plannedAt: new Date(),

        notes: "Execution plan for transfer transition smoke",
      },
    },
  });

  const applyPlanContext = {
    ...createdContext,

    commandId: `smoke-transfer-apply-plan-command-${fixtureId}`,

    actorId: `smoke-transfer-plan-operator-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-apply-plan-${fixtureId}`,
  };

  const stalePlanContext = {
    ...applyPlanContext,

    commandId: `smoke-transfer-stale-plan-command-${fixtureId}`,

    actorId: `smoke-transfer-stale-plan-operator-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-transfer-stale-plan-${fixtureId}`,
  };

  const staleEventId = `smoke-transfer-stale-plan-event-${fixtureId}`;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await persistNewTreasuryTransferWithClient({
        result: created,

        eventId: `smoke-transfer-created-event-${fixtureId}`,

        context: createdContext,

        client: tx,
      });
    });

    const reviewStarted = await prisma.$transaction(
      async (tx: TransactionClient) =>
        executeDurableTreasuryTransferTransitionWithClient({
          transferId,

          eventId: `smoke-transfer-review-started-event-${fixtureId}`,

          context: reviewContext,

          apply: (aggregate) =>
            beginTreasuryTransferAuthorityReview(aggregate, {
              context: reviewContext,

              payload: {
                transferId,
              },
            }),

          client: tx,
        }),
    );

    assertVersionAndStatus(
      reviewStarted.aggregate,
      2,
      TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW,
    );

    assert.equal(
      reviewStarted.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_REVIEW_STARTED,
    );

    const authorized = await prisma.$transaction(
      async (tx: TransactionClient) =>
        executeDurableTreasuryTransferTransitionWithClient({
          transferId,

          eventId: `smoke-transfer-authorized-event-${fixtureId}`,

          context: authorityContext,

          apply: (aggregate) =>
            applyTreasuryTransferAuthorityAssessment(
              aggregate,

              authorityAssessment.aggregate,

              {
                context: authorityContext,

                payload: {
                  transferId,

                  assessmentId: authorityAssessmentId,
                },
              },
            ),

          client: tx,
        }),
    );

    assertVersionAndStatus(
      authorized.aggregate,
      3,
      TREASURY_TRANSFER_STATUS.AUTHORIZED,
    );

    assert.equal(
      authorized.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORIZED,
    );

    const capacityApplied = await prisma.$transaction(
      async (tx: TransactionClient) =>
        executeDurableTreasuryTransferTransitionWithClient({
          transferId,

          eventId: `smoke-transfer-capacity-applied-event-${fixtureId}`,

          context: capacityContext,

          apply: (aggregate) =>
            applyTreasuryTransferCapacityAssessment(
              aggregate,

              capacityAssessment.aggregate,

              {
                context: capacityContext,

                payload: {
                  transferId,

                  assessmentId: capacityAssessmentId,
                },
              },
            ),

          client: tx,
        }),
    );

    assertVersionAndStatus(
      capacityApplied.aggregate,
      4,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(
      capacityApplied.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_ASSESSED,
    );

    /*
     * Produce a transition result from version 4 before the durable
     * aggregate advances to version 5. We will later attempt to persist
     * this result as a competing stale write.
     */
    const stalePlanResult = applyTreasuryExecutionPlan(
      capacityApplied.aggregate,

      recordedPlan.aggregate,

      {
        context: stalePlanContext,

        payload: {
          transferId,

          planId,
        },
      },
    );

    const planned = await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryTransferTransitionWithClient({
        transferId,

        eventId: `smoke-transfer-planned-event-${fixtureId}`,

        context: applyPlanContext,

        apply: (aggregate) =>
          applyTreasuryExecutionPlan(
            aggregate,

            recordedPlan.aggregate,

            {
              context: applyPlanContext,

              payload: {
                transferId,

                planId,
              },
            },
          ),

        client: tx,
      }),
    );

    assertVersionAndStatus(
      planned.aggregate,
      5,
      TREASURY_TRANSFER_STATUS.PLANNED,
    );

    assert.equal(
      planned.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
    );

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryTransferWithClient({
        transferId,

        client: tx,
      }),
    );

    assert(loaded);

    assertVersionAndStatus(
      loaded.aggregate,
      5,
      TREASURY_TRANSFER_STATUS.PLANNED,
    );

    assert.equal(loaded.aggregate.id, transferId);

    assert.equal(loaded.aggregate.reference, created.aggregate.reference);

    assert.equal(loaded.aggregate.requestedAmount.amount, "1000000.00");

    assert.equal(loaded.aggregate.requestedAmount.currency, "USD");

    assert.equal(loaded.aggregate.destinationCurrency, "EUR");

    let staleWriteError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistTreasuryTransferTransitionWithClient({
          expectedVersion: 4,

          result: stalePlanResult,

          eventId: staleEventId,

          context: stalePlanContext,

          client: tx,
        }),
      );
    } catch (error: unknown) {
      staleWriteError = error;
    }

    assertErrorCode(
      staleWriteError,
      "TREASURY_GATEWAY_TRANSFER_CONCURRENCY_CONFLICT",
    );

    const aggregateRow = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: transferId,
        },
      },
    });

    assert(aggregateRow);

    assert.equal(aggregateRow.version, 5);

    assert.equal(aggregateRow.status, TREASURY_TRANSFER_STATUS.PLANNED);

    type TransferEventRow = {
      eventId: string;
      aggregateId: string;
      aggregateVersion: number;
      eventType: string;
      payload: unknown;
    };

    const events: TransferEventRow[] =
      await prisma.treasuryGatewayEvent.findMany({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: transferId,
        },

        orderBy: {
          aggregateVersion: "asc",
        },
      });

    assert.equal(events.length, 5);

    assert.deepEqual(
      events.map((event) => event.aggregateVersion),
      [1, 2, 3, 4, 5],
    );

    assert.deepEqual(
      events.map((event) => event.eventType),
      [
        TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CREATED,

        TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_REVIEW_STARTED,

        TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORIZED,

        TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_ASSESSED,

        TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
      ],
    );

    for (const event of events) {
      assert.equal(event.aggregateId, transferId);

      const payload = event.payload as {
        transferId?: unknown;
      };

      assert.equal(payload.transferId, transferId);
    }

    const staleEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        eventId: staleEventId,
      },
    });

    assert.equal(staleEventCount, 0);

    console.log(
      "✓ Treasury Gateway Transfer transition persistence smoke test passed",
    );

    console.log({
      transferId,

      finalStatus: loaded.aggregate.status,

      finalVersion: loaded.aggregate.metadata.version,

      eventVersions: events.map((event) => event.aggregateVersion),

      eventTypes: events.map((event) => event.eventType),

      invariants: {
        completeLifecyclePersisted: true,

        transferReloadedAtFinalState: true,

        versionsAreContiguous: true,

        oneEventExistsPerVersion: true,

        allEventsTargetTransfer: true,

        staleTransitionRejected: true,

        staleAttemptDidNotMutateSnapshot: true,

        staleAttemptDidNotAppendEvent: true,
      },
    });
  } finally {
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
