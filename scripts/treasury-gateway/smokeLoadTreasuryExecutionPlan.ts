import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import { TREASURY_EXECUTION_PLAN_STATUS } from "../../src/domains/treasury/gateway/execution-plans/status";

import { loadTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import { persistNewTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/persistNewTreasuryExecutionPlanWithClient";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-load-plan-transfer-${fixtureId}`;

  const capacityAssessmentId = `smoke-load-plan-capacity-${fixtureId}`;

  const planId = `smoke-load-plan-${fixtureId}`;

  const eventId = `smoke-load-plan-event-${fixtureId}`;

  const context = {
    commandId: `smoke-load-plan-command-${fixtureId}`,

    actorId: `smoke-load-plan-actor-${fixtureId}`,

    correlationId: `smoke-load-plan-correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `smoke-load-plan-${fixtureId}`,
  };

  const capacityAssessment = recordTransferCapacityAssessment({
    assessmentId: capacityAssessmentId,

    command: {
      context,

      payload: {
        transferId,

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        constraints: [
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "1000000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [`smoke-load-plan-evidence-${fixtureId}`],
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
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "EUR",

        tranches: [
          {
            trancheId: `smoke-load-plan-tranche-${fixtureId}`,

            sequence: 1,

            amount: {
              amount: "1000000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `smoke-load-plan-allocation-${fixtureId}`,

            instructionId: `smoke-load-plan-instruction-${fixtureId}`,

            settlementEndpointId: `smoke-load-plan-endpoint-${fixtureId}`,

            purpose: "Load Treasury Execution Plan smoke test",
          },
        ],

        plannedAt: new Date(),
      },
    },
  });

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryExecutionPlanWithClient({
        result: recorded,

        eventId,

        context,

        client: tx,
      }),
    );

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionPlanWithClient({
        planId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(
      loaded.aggregate.id,

      recorded.aggregate.id,
    );

    assert.equal(
      loaded.aggregate.status,

      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(
      loaded.aggregate.metadata.version,

      1,
    );

    assert.equal(
      loaded.aggregate.transferId,

      transferId,
    );

    assert.deepEqual(
      loaded.aggregate.plannedAmount,

      recorded.aggregate.plannedAmount,
    );

    assert.equal(
      loaded.aggregate.destinationCurrency,

      "EUR",
    );

    assert.equal(
      loaded.aggregate.tranches.length,

      1,
    );

    assert.equal(
      loaded.aggregate.tranches[0]?.allocationId,

      recorded.aggregate.tranches[0]?.allocationId,
    );

    assert.equal(
      loaded.aggregate.tranches[0]?.executionId,

      undefined,
    );

    assert(loaded.aggregate.plannedAt instanceof Date);

    assert(loaded.aggregate.metadata.createdAt instanceof Date);

    console.log("✓ Treasury Gateway Execution Plan load smoke test passed");

    console.log({
      planId: loaded.aggregate.id,

      status: loaded.aggregate.status,

      version: loaded.aggregate.metadata.version,

      trancheCount: loaded.aggregate.tranches.length,

      invariants: {
        persistedPlanLoaded: true,

        datesRehydrated: true,

        nestedTranchesDecoded: true,

        optionalExecutionBindingPreserved: true,

        snapshotIdentityVerified: true,

        snapshotVersionVerified: true,

        snapshotStatusVerified: true,
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
