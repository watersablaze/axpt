import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/recordExecutableTrancheEligibilityAssessment";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/contracts";

import { executeDurableTreasuryExecutionPlanTransitionWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/executeDurableTreasuryExecutionPlanTransitionWithClient";

import { applyExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/execution-plans/applyExecutableTrancheEligibilityAssessment";

import { bindExecutableTrancheToTreasuryExecution } from "../../src/domains/treasury/gateway/execution-plans/bindExecutableTrancheToTreasuryExecution";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import { loadTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import { persistNewTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/persistNewTreasuryExecutionPlanWithClient";

import { persistTreasuryExecutionPlanTransitionWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/persistTreasuryExecutionPlanTransitionWithClient";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

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

  const transferId = `smoke-plan-transition-transfer-${fixtureId}`;

  const capacityAssessmentId = `smoke-plan-transition-capacity-${fixtureId}`;

  const planId = `smoke-plan-transition-plan-${fixtureId}`;

  const trancheId = `smoke-plan-transition-tranche-${fixtureId}`;

  const executionId = `smoke-plan-transition-execution-${fixtureId}`;

  const correlationId = `smoke-plan-transition-correlation-${fixtureId}`;

  const recordContext = {
    commandId: `smoke-plan-transition-record-command-${fixtureId}`,

    actorId: `smoke-plan-transition-planner-${fixtureId}`,

    correlationId,

    requestedAt: new Date(),

    idempotencyKey: `smoke-plan-transition-record-${fixtureId}`,
  };

  const capacityAssessment = recordTransferCapacityAssessment({
    assessmentId: capacityAssessmentId,

    command: {
      context: recordContext,

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

            evidenceReferenceIds: [`smoke-plan-transition-rail-${fixtureId}`],
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
      context: recordContext,

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

            allocationId: `smoke-plan-transition-allocation-${fixtureId}`,

            instructionId: `smoke-plan-transition-instruction-${fixtureId}`,

            beneficiaryProfileId: `smoke-plan-transition-beneficiary-${fixtureId}`,

            settlementEndpointId: `smoke-plan-transition-endpoint-${fixtureId}`,

            purpose: "Persist Treasury Execution Plan transitions smoke test",
          },
        ],

        plannedAt: new Date(),
      },
    },
  });

  const eligibilityAssessment = recordExecutableTrancheEligibilityAssessment({
    assessmentId: `smoke-plan-transition-eligibility-${fixtureId}`,

    plan: recorded.aggregate,

    command: {
      context: {
        ...recordContext,

        commandId: `smoke-plan-transition-eligibility-command-${fixtureId}`,

        actorId: `smoke-plan-transition-assessor-${fixtureId}`,

        idempotencyKey: `smoke-plan-transition-eligibility-${fixtureId}`,
      },

      payload: {
        transferId,

        planId,

        trancheId,

        result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

        evidenceArtifactIds: [`smoke-plan-transition-evidence-${fixtureId}`],

        assessedAt: new Date(),
      },
    },
  });

  const eligibilityContext = {
    ...recordContext,

    commandId: `smoke-plan-transition-apply-eligibility-command-${fixtureId}`,

    actorId: `smoke-plan-transition-eligibility-operator-${fixtureId}`,

    idempotencyKey: `smoke-plan-transition-apply-eligibility-${fixtureId}`,
  };

  const createdExecution = createTreasuryExecution({
    executionId,

    reference: `SMOKE-PLAN-TRANSITION-${fixtureId}`,

    command: {
      context: {
        ...recordContext,

        commandId: `smoke-plan-transition-create-execution-${fixtureId}`,

        actorId: `smoke-plan-transition-execution-creator-${fixtureId}`,

        idempotencyKey: `smoke-plan-transition-create-execution-${fixtureId}`,
      },

      payload: {
        programId: `smoke-plan-transition-program-${fixtureId}`,

        allocationId: recorded.aggregate.tranches[0]!.allocationId,

        instructionId: recorded.aggregate.tranches[0]!.instructionId,

        kind: recorded.aggregate.tranches[0]!.executionKind,

        beneficiaryProfileId:
          recorded.aggregate.tranches[0]!.beneficiaryProfileId,

        settlementEndpointId:
          recorded.aggregate.tranches[0]!.settlementEndpointId,

        amount: recorded.aggregate.tranches[0]!.amount,

        purpose: recorded.aggregate.tranches[0]!.purpose,
      },
    },
  });

  const bindingContext = {
    ...recordContext,

    commandId: `smoke-plan-transition-bind-command-${fixtureId}`,

    actorId: `smoke-plan-transition-binding-operator-${fixtureId}`,

    idempotencyKey: `smoke-plan-transition-bind-${fixtureId}`,
  };

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryExecutionPlanWithClient({
        result: recorded,

        eventId: `smoke-plan-transition-record-event-${fixtureId}`,

        context: recordContext,

        client: tx,
      }),
    );

    const eligible = await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryExecutionPlanTransitionWithClient({
        planId,

        eventId: `smoke-plan-transition-eligible-event-${fixtureId}`,

        context: eligibilityContext,

        apply: (aggregate) =>
          applyExecutableTrancheEligibilityAssessment(
            aggregate,

            eligibilityAssessment.aggregate,

            {
              context: eligibilityContext,

              payload: {
                planId,

                assessmentId: eligibilityAssessment.aggregate.id,
              },
            },
          ),

        client: tx,
      }),
    );

    assert.equal(
      eligible.aggregate.metadata.version,

      2,
    );

    assert.equal(
      eligible.aggregate.tranches[0]?.status,

      EXECUTABLE_TRANCHE_STATUS.ELIGIBLE,
    );

    assert.equal(
      eligible.event.eventType,

      TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_ELIGIBLE,
    );

    const bound = await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryExecutionPlanTransitionWithClient({
        planId,

        eventId: `smoke-plan-transition-bound-event-${fixtureId}`,

        context: bindingContext,

        apply: (aggregate) =>
          bindExecutableTrancheToTreasuryExecution(
            aggregate,

            createdExecution.aggregate,

            {
              context: bindingContext,

              payload: {
                planId,

                trancheId,

                executionId,
              },
            },
          ),

        client: tx,
      }),
    );

    assert.equal(
      bound.aggregate.metadata.version,

      3,
    );

    assert.equal(
      bound.aggregate.status,

      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(
      bound.aggregate.tranches[0]?.status,

      EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,
    );

    assert.equal(
      bound.aggregate.tranches[0]?.executionId,

      executionId,
    );

    assert.equal(
      bound.event.eventType,

      TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_BOUND_TO_EXECUTION,
    );

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionPlanWithClient({
        planId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(
      loaded.aggregate.metadata.version,

      3,
    );

    assert.equal(
      loaded.aggregate.tranches[0]?.status,

      EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,
    );

    assert.equal(
      loaded.aggregate.tranches[0]?.executionId,

      executionId,
    );

    const staleBindingResult = bindExecutableTrancheToTreasuryExecution(
      eligible.aggregate,

      createdExecution.aggregate,

      {
        context: {
          ...bindingContext,

          commandId: `smoke-plan-transition-stale-bind-command-${fixtureId}`,

          idempotencyKey: `smoke-plan-transition-stale-bind-${fixtureId}`,
        },

        payload: {
          planId,

          trancheId,

          executionId,
        },
      },
    );

    let concurrencyError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistTreasuryExecutionPlanTransitionWithClient({
          expectedVersion: 2,

          result: staleBindingResult,

          eventId: `smoke-plan-transition-stale-event-${fixtureId}`,

          context: bindingContext,

          client: tx,
        }),
      );
    } catch (error: unknown) {
      concurrencyError = error;
    }

    assertErrorCode(
      concurrencyError,

      "TREASURY_GATEWAY_EXECUTION_PLAN_CONCURRENCY_CONFLICT",
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

      3,
    );

    console.log(
      "✓ Treasury Gateway Execution Plan transition persistence smoke test passed",
    );

    console.log({
      planId,

      status: loaded.aggregate.status,

      version: loaded.aggregate.metadata.version,

      tranche: {
        id: loaded.aggregate.tranches[0]?.id,

        status: loaded.aggregate.tranches[0]?.status,

        executionId: loaded.aggregate.tranches[0]?.executionId,
      },

      eventCount,

      invariants: {
        eligibilityTransitionPersisted: true,

        bindingTransitionPersisted: true,

        nestedTrancheStateReloaded: true,

        executionIdentityReloaded: true,

        optimisticConcurrencyEnforced: true,

        staleTransitionDidNotAppendEvent: true,

        oneAggregateThreeVersions: true,
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
