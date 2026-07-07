import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import { TREASURY_EXECUTION_PLAN_STATUS } from "../../src/domains/treasury/gateway/execution-plans/status";

import { persistNewTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/persistNewTreasuryExecutionPlanWithClient";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

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

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-transfer-plan-${fixtureId}`;

  const capacityAssessmentId = `smoke-capacity-assessment-plan-${fixtureId}`;

  const planId = `smoke-execution-plan-${fixtureId}`;

  const eventId = `smoke-plan-event-${fixtureId}`;

  const context = {
    commandId: `smoke-plan-command-${fixtureId}`,

    actorId: `smoke-plan-actor-${fixtureId}`,

    authorityGrantId: `smoke-plan-authority-${fixtureId}`,

    correlationId: `smoke-plan-correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-create-plan-${fixtureId}`,
  };

  const capacityAssessment = recordTransferCapacityAssessment({
    assessmentId: capacityAssessmentId,

    command: {
      context: {
        ...context,

        commandId: `smoke-capacity-command-${fixtureId}`,

        idempotencyKey: `smoke-capacity-${fixtureId}`,
      },

      payload: {
        transferId,

        requestedAmount: {
          amount: "400000000.00",

          currency: "USD",
        },

        constraints: [
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "400000000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [`smoke-rail-evidence-${fixtureId}`],
          },
        ],

        assessedAt: new Date(),
      },
    },
  });

  const recorded = recordTreasuryExecutionPlan({
    planId,

    capacityAssessment: capacityAssessment.aggregate,

    command: {
      context,

      payload: {
        transferId,

        capacityAssessmentId,

        plannedAmount: {
          amount: "400000000.00",

          currency: "USD",
        },

        destinationCurrency: "EUR",

        tranches: [
          {
            trancheId: `smoke-tranche-${fixtureId}`,

            sequence: 1,

            amount: {
              amount: "400000000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `smoke-allocation-${fixtureId}`,

            instructionId: `smoke-instruction-${fixtureId}`,

            beneficiaryProfileId: `smoke-beneficiary-${fixtureId}`,

            settlementEndpointId: `smoke-settlement-endpoint-${fixtureId}`,

            purpose: "Persist new Treasury Execution Plan smoke test",
          },
        ],

        plannedAt: new Date(),
      },
    },
  });

  try {
    const persisted = await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryExecutionPlanWithClient({
        result: recorded,

        eventId,

        context,

        client: tx,
      }),
    );

    assert.equal(
      persisted.aggregate.status,

      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(
      persisted.aggregate.metadata.version,

      1,
    );

    assert.equal(
      persisted.aggregate.tranches.length,

      1,
    );

    assert.equal(
      persisted.event.eventId,

      eventId,
    );

    assert(persisted.event.sequence > 0n);

    assert.equal(
      persisted.event.aggregateType,

      TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
    );

    assert.equal(
      persisted.event.aggregateVersion,

      1,
    );

    assert.equal(
      persisted.event.eventType,

      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,
    );

    const snapshot = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

          aggregateId: planId,
        },
      },
    });

    assert(snapshot);

    assert.equal(
      snapshot.version,

      1,
    );

    assert.equal(
      snapshot.status,

      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    const snapshotJson = snapshot.snapshot as Record<string, unknown>;

    assert.equal(
      snapshotJson.id,

      planId,
    );

    assert.equal(
      snapshotJson.status,

      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    const snapshotTranches = snapshotJson.tranches;

    assert(Array.isArray(snapshotTranches));

    assert.equal(
      snapshotTranches.length,

      1,
    );

    const event = await prisma.treasuryGatewayEvent.findUnique({
      where: {
        eventId,
      },
    });

    assert(event);

    assert.equal(
      event.aggregateType,

      TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
    );

    assert.equal(
      event.aggregateId,

      planId,
    );

    assert.equal(
      event.aggregateVersion,

      1,
    );

    assert.equal(
      event.eventType,

      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,
    );

    assert.equal(
      event.sequence,

      persisted.event.sequence,
    );

    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistNewTreasuryExecutionPlanWithClient({
          result: recorded,

          eventId: `smoke-plan-event-duplicate-${fixtureId}`,

          context,

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicateError = error;
    }

    assertErrorCode(
      duplicateError,

      "TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS",
    );

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    });

    assert.equal(
      aggregateCount,

      1,
    );

    assert.equal(
      eventCount,

      1,
    );

    console.log(
      "✓ Treasury Gateway new Execution Plan persistence smoke test passed",
    );

    console.log({
      planId,

      status: snapshot.status,

      version: snapshot.version,

      trancheCount: snapshotTranches.length,

      eventId,

      sequence: persisted.event.sequence.toString(),

      eventType: persisted.event.eventType,

      invariants: {
        planSnapshotPersisted: true,

        planRecordedEventPersisted: true,

        aggregateTypeSeparated: true,

        duplicatePlanRejected: true,

        duplicateAttemptDidNotAppendEvent: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
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
