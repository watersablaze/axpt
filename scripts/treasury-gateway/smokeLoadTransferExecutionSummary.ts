import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient";

import { executeDurableTreasuryExecutionPlanTransitionWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/executeDurableTreasuryExecutionPlanTransitionWithClient";

import { applyExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/execution-plans/applyExecutableTrancheEligibilityAssessment";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import type { ExecutableTranche } from "../../src/domains/treasury/gateway/execution-plans/contracts";

import { loadTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import { persistNewTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/persistNewTreasuryExecutionPlanWithClient";

import { EXECUTABLE_TRANCHE_STATUS } from "../../src/domains/treasury/gateway/execution-plans/status";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/contracts";

import { recordExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/recordExecutableTrancheEligibilityAssessment";

import { executeDurableTreasuryTransferTransitionWithClient } from "../../src/domains/treasury/gateway/transfers/application/executeDurableTreasuryTransferTransitionWithClient";

import { applyTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/transfers/applyTreasuryExecutionPlan";

import { applyTreasuryTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";

import { applyTreasuryTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferCapacityAssessment";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { persistNewTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/persistNewTreasuryTransferWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import { loadTransferExecutionSummaryWithClient } from "../../src/domains/treasury/gateway/transfer-execution-summary/application/loadTransferExecutionSummaryWithClient";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-mesh-transfer-${fixtureId}`;

  const authorityAssessmentId = `smoke-mesh-authority-assessment-${fixtureId}`;

  const capacityAssessmentId = `smoke-mesh-capacity-assessment-${fixtureId}`;

  const planId = `smoke-mesh-plan-${fixtureId}`;

  const firstTrancheId = `smoke-mesh-tranche-001-${fixtureId}`;

  const secondTrancheId = `smoke-mesh-tranche-002-${fixtureId}`;

  const firstEligibilityAssessmentId = `smoke-mesh-eligibility-001-${fixtureId}`;

  const secondEligibilityAssessmentId = `smoke-mesh-eligibility-002-${fixtureId}`;

  const successfulExecutionId = `smoke-mesh-execution-success-${fixtureId}`;

  const successfulExecutionEventId = `smoke-mesh-execution-success-event-${fixtureId}`;

  const successfulBindingEventId = `smoke-mesh-binding-success-event-${fixtureId}`;

  const correlationId = `smoke-mesh-correlation-${fixtureId}`;

  const baseContext = {
    commandId: `smoke-mesh-command-${fixtureId}`,

    actorId: `smoke-mesh-actor-${fixtureId}`,

    correlationId,

    requestedAt: new Date(),

    idempotencyKey: `smoke-mesh-${fixtureId}`,
  };

  const createdTransfer = createTreasuryTransfer({
    transferId,

    reference: `AXPT-MESH-TRANSFER-${fixtureId}`,

    command: {
      context: {
        ...baseContext,

        commandId: `smoke-mesh-create-transfer-${fixtureId}`,

        idempotencyKey: `smoke-mesh-create-transfer-${fixtureId}`,
      },

      payload: {
        programId: `smoke-mesh-program-${fixtureId}`,

        instructionId: `smoke-mesh-instruction-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-mesh-program-account-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-mesh-settlement-endpoint-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "EUR",

        purpose: "Atomic Treasury Execution mesh smoke test",
      },
    },
  });

  const authorityAssessment = recordTransferAuthorityAssessment({
    assessmentId: authorityAssessmentId,

    command: {
      context: {
        ...baseContext,

        commandId: `smoke-mesh-record-authority-${fixtureId}`,

        idempotencyKey: `smoke-mesh-record-authority-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [`smoke-mesh-authority-evidence-${fixtureId}`],

        assessedAt: new Date(),
      },
    },
  });

  const capacityAssessment = recordTransferCapacityAssessment({
    assessmentId: capacityAssessmentId,

    command: {
      context: {
        ...baseContext,

        commandId: `smoke-mesh-record-capacity-${fixtureId}`,

        idempotencyKey: `smoke-mesh-record-capacity-${fixtureId}`,
      },

      payload: {
        transferId,

        requestedAmount: createdTransfer.aggregate.requestedAmount,

        constraints: [
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "1000000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [`smoke-mesh-capacity-evidence-${fixtureId}`],
          },
        ],

        assessedAt: new Date(),
      },
    },
  });

  const recordedPlan = recordTreasuryExecutionPlan({
    planId,

    capacityAssessment: capacityAssessment.aggregate,

    command: {
      context: {
        ...baseContext,

        commandId: `smoke-mesh-record-plan-${fixtureId}`,

        actorId: `smoke-mesh-planner-${fixtureId}`,

        idempotencyKey: `smoke-mesh-record-plan-${fixtureId}`,
      },

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
            trancheId: firstTrancheId,

            sequence: 1,

            amount: {
              amount: "500000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `smoke-mesh-allocation-001-${fixtureId}`,

            instructionId: createdTransfer.aggregate.instructionId,

            beneficiaryProfileId: `smoke-mesh-beneficiary-001-${fixtureId}`,

            settlementEndpointId: `smoke-mesh-settlement-endpoint-${fixtureId}`,

            purpose: "First atomic execution tranche",
          },

          {
            trancheId: secondTrancheId,

            sequence: 2,

            amount: {
              amount: "500000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `smoke-mesh-allocation-002-${fixtureId}`,

            instructionId: createdTransfer.aggregate.instructionId,

            beneficiaryProfileId: `smoke-mesh-beneficiary-002-${fixtureId}`,

            settlementEndpointId: `smoke-mesh-settlement-endpoint-${fixtureId}`,

            purpose: "Rollback-protected execution tranche",
          },
        ],

        plannedAt: new Date(),

        notes: "Two-tranche atomic execution mesh fixture",
      },
    },
  });

  try {
    /*
     * Persist and advance the Transfer to PLANNED.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await persistNewTreasuryTransferWithClient({
        result: createdTransfer,

        eventId: `smoke-mesh-transfer-created-event-${fixtureId}`,

        context: createdTransfer.aggregate.metadata
          ? {
              ...baseContext,

              commandId: `smoke-mesh-create-transfer-${fixtureId}`,

              idempotencyKey: `smoke-mesh-create-transfer-${fixtureId}`,
            }
          : baseContext,

        client: tx,
      });
    });

    await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryTransferTransitionWithClient({
        transferId,

        eventId: `smoke-mesh-authority-review-started-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-begin-review-${fixtureId}`,

          idempotencyKey: `smoke-mesh-begin-review-${fixtureId}`,
        },

        apply: (aggregate) =>
          beginTreasuryTransferAuthorityReview(aggregate, {
            context: {
              ...baseContext,

              commandId: `smoke-mesh-begin-review-${fixtureId}`,

              idempotencyKey: `smoke-mesh-begin-review-${fixtureId}`,
            },

            payload: {
              transferId,
            },
          }),

        client: tx,
      }),
    );

    await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryTransferTransitionWithClient({
        transferId,

        eventId: `smoke-mesh-transfer-authorized-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-apply-authority-${fixtureId}`,

          idempotencyKey: `smoke-mesh-apply-authority-${fixtureId}`,
        },

        apply: (aggregate) =>
          applyTreasuryTransferAuthorityAssessment(
            aggregate,

            authorityAssessment.aggregate,

            {
              context: {
                ...baseContext,

                commandId: `smoke-mesh-apply-authority-${fixtureId}`,

                idempotencyKey: `smoke-mesh-apply-authority-${fixtureId}`,
              },

              payload: {
                transferId,

                assessmentId: authorityAssessmentId,
              },
            },
          ),

        client: tx,
      }),
    );

    await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryTransferTransitionWithClient({
        transferId,

        eventId: `smoke-mesh-capacity-assessed-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-apply-capacity-${fixtureId}`,

          idempotencyKey: `smoke-mesh-apply-capacity-${fixtureId}`,
        },

        apply: (aggregate) =>
          applyTreasuryTransferCapacityAssessment(
            aggregate,

            capacityAssessment.aggregate,

            {
              context: {
                ...baseContext,

                commandId: `smoke-mesh-apply-capacity-${fixtureId}`,

                idempotencyKey: `smoke-mesh-apply-capacity-${fixtureId}`,
              },

              payload: {
                transferId,

                assessmentId: capacityAssessmentId,
              },
            },
          ),

        client: tx,
      }),
    );

    await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryTransferTransitionWithClient({
        transferId,

        eventId: `smoke-mesh-transfer-planned-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-apply-plan-${fixtureId}`,

          idempotencyKey: `smoke-mesh-apply-plan-${fixtureId}`,
        },

        apply: (aggregate) =>
          applyTreasuryExecutionPlan(
            aggregate,

            recordedPlan.aggregate,

            {
              context: {
                ...baseContext,

                commandId: `smoke-mesh-apply-plan-${fixtureId}`,

                idempotencyKey: `smoke-mesh-apply-plan-${fixtureId}`,
              },

              payload: {
                transferId,

                planId,
              },
            },
          ),

        client: tx,
      }),
    );

    /*
     * Persist the Execution Plan at v1.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await persistNewTreasuryExecutionPlanWithClient({
        result: recordedPlan,

        eventId: `smoke-mesh-plan-recorded-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-record-plan-${fixtureId}`,

          actorId: `smoke-mesh-planner-${fixtureId}`,

          idempotencyKey: `smoke-mesh-record-plan-${fixtureId}`,
        },

        client: tx,
      });
    });

    /*
     * Make tranche 001 ELIGIBLE: plan v1 → v2.
     */
    const firstEligibilityAssessment =
      recordExecutableTrancheEligibilityAssessment({
        assessmentId: firstEligibilityAssessmentId,

        plan: recordedPlan.aggregate,

        command: {
          context: {
            ...baseContext,

            commandId: `smoke-mesh-record-eligibility-001-${fixtureId}`,

            idempotencyKey: `smoke-mesh-record-eligibility-001-${fixtureId}`,
          },

          payload: {
            transferId,

            planId,

            trancheId: firstTrancheId,

            result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

            evidenceArtifactIds: [
              `smoke-mesh-eligibility-evidence-001-${fixtureId}`,
            ],

            assessedAt: new Date(),
          },
        },
      });

    await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryExecutionPlanTransitionWithClient({
        planId,

        eventId: `smoke-mesh-eligibility-applied-001-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-apply-eligibility-001-${fixtureId}`,

          idempotencyKey: `smoke-mesh-apply-eligibility-001-${fixtureId}`,
        },

        apply: (aggregate) =>
          applyExecutableTrancheEligibilityAssessment(
            aggregate,

            firstEligibilityAssessment.aggregate,

            {
              context: {
                ...baseContext,

                commandId: `smoke-mesh-apply-eligibility-001-${fixtureId}`,

                idempotencyKey: `smoke-mesh-apply-eligibility-001-${fixtureId}`,
              },

              payload: {
                planId,

                assessmentId: firstEligibilityAssessmentId,
              },
            },
          ),

        client: tx,
      }),
    );

    /*
     * Reload v2, then make tranche 002 ELIGIBLE: plan v2 → v3.
     */
    const planAfterFirstEligibility = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionPlanWithClient({
          planId,

          client: tx,
        }),
    );

    assert(planAfterFirstEligibility);

    const secondEligibilityAssessment =
      recordExecutableTrancheEligibilityAssessment({
        assessmentId: secondEligibilityAssessmentId,

        plan: planAfterFirstEligibility.aggregate,

        command: {
          context: {
            ...baseContext,

            commandId: `smoke-mesh-record-eligibility-002-${fixtureId}`,

            idempotencyKey: `smoke-mesh-record-eligibility-002-${fixtureId}`,
          },

          payload: {
            transferId,

            planId,

            trancheId: secondTrancheId,

            result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

            evidenceArtifactIds: [
              `smoke-mesh-eligibility-evidence-002-${fixtureId}`,
            ],

            assessedAt: new Date(),
          },
        },
      });

    await prisma.$transaction(async (tx: TransactionClient) =>
      executeDurableTreasuryExecutionPlanTransitionWithClient({
        planId,

        eventId: `smoke-mesh-eligibility-applied-002-event-${fixtureId}`,

        context: {
          ...baseContext,

          commandId: `smoke-mesh-apply-eligibility-002-${fixtureId}`,

          idempotencyKey: `smoke-mesh-apply-eligibility-002-${fixtureId}`,
        },

        apply: (aggregate) =>
          applyExecutableTrancheEligibilityAssessment(
            aggregate,

            secondEligibilityAssessment.aggregate,

            {
              context: {
                ...baseContext,

                commandId: `smoke-mesh-apply-eligibility-002-${fixtureId}`,

                idempotencyKey: `smoke-mesh-apply-eligibility-002-${fixtureId}`,
              },

              payload: {
                planId,

                assessmentId: secondEligibilityAssessmentId,
              },
            },
          ),

        client: tx,
      }),
    );

    /*
     * SUCCESS PATH:
     *
     * execution created
     * +
     * tranche 001 bound
     *
     * in one transaction.
     */
    const successfulInstantiation = await prisma.$transaction(
      async (tx: TransactionClient) =>
        instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient({
          transferId,

          planId,

          trancheId: firstTrancheId,

          executionId: successfulExecutionId,

          executionReference: `AXPT-MESH-EXECUTION-SUCCESS-${fixtureId}`,

          executionCreatedEventId: successfulExecutionEventId,

          trancheBoundEventId: successfulBindingEventId,

          context: {
            ...baseContext,

            commandId: `smoke-mesh-instantiate-success-${fixtureId}`,

            actorId: `smoke-mesh-instantiator-${fixtureId}`,

            idempotencyKey: `smoke-mesh-instantiate-success-${fixtureId}`,
          },

          client: tx,
        }),
    );

    assert.equal(
      successfulInstantiation.execution.aggregate.id,
      successfulExecutionId,
    );

    assert.equal(successfulInstantiation.execution.aggregate.status, "CREATED");

    assert.equal(successfulInstantiation.plan.aggregate.metadata.version, 4);

    const successfullyBoundTranche =
      successfulInstantiation.plan.aggregate.tranches.find(
        (tranche: ExecutableTranche) => tranche.id === firstTrancheId,
      );

    assert(successfullyBoundTranche);

    assert.equal(
      successfullyBoundTranche.status,
      EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,
    );

    assert.equal(successfullyBoundTranche.executionId, successfulExecutionId);

    const summary = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTransferExecutionSummaryWithClient({
        transferId,

        client: tx,
      }),
    );

    assert(summary);

    assert.equal(summary.transferId, transferId);

    assert.equal(summary.planId, planId);

    assert.equal(summary.transferStatus, "PLANNED");

    assert.equal(summary.planStatus, "RECORDED");

    assert.equal(summary.transferVersion, 5);

    assert.equal(summary.planVersion, 4);

    assert.equal(summary.trancheCounts.total, 2);

    assert.equal(summary.trancheCounts.boundToExecution, 1);

    assert.equal(summary.trancheCounts.eligible, 1);

    assert.equal(summary.trancheCounts.planned, 0);

    assert.equal(summary.executionCounts.CREATED, 1);

    assert.equal(summary.executionCounts.CONFIRMED, 0);

    assert.equal(summary.executionCounts.FAILED, 0);

    assert.deepEqual(summary.amounts.planned, {
      amount: "1000000.00",

      currency: "USD",
    });

    assert.deepEqual(summary.amounts.bound, {
      amount: "500000",

      currency: "USD",
    });

    assert.deepEqual(summary.amounts.remainingUnbound, {
      amount: "500000",

      currency: "USD",
    });

    assert.deepEqual(summary.amounts.confirmed, {
      amount: "0",

      currency: "USD",
    });

    assert.deepEqual(summary.amounts.failed, {
      amount: "0",

      currency: "USD",
    });

    const missingSummary = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTransferExecutionSummaryWithClient({
          transferId: `missing-summary-transfer-${fixtureId}`,

          client: tx,
        }),
    );

    assert.equal(missingSummary, null);

    console.log(
      "✓ Treasury Transfer Execution Summary durable load smoke test passed",
    );

    console.log({
      transfer: {
        id: summary.transferId,

        status: summary.transferStatus,

        version: summary.transferVersion,
      },

      plan: {
        id: summary.planId,

        status: summary.planStatus,

        version: summary.planVersion,
      },

      tranches: summary.trancheCounts,

      executions: {
        created: summary.executionCounts.CREATED,

        confirmed: summary.executionCounts.CONFIRMED,

        failed: summary.executionCounts.FAILED,
      },

      amounts: summary.amounts,

      invariants: {
        durableTransferLoaded: true,

        planningEvidenceResolvedPlan: true,

        durablePlanLoaded: true,

        boundExecutionIdentitiesDiscovered: true,

        exactExecutionsLoaded: true,

        summaryDerivedFromRepositoryState: true,

        missingTransferReturnsNull: true,

        noProjectionPersisted: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateId: {
          in: [transferId, planId, successfulExecutionId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateId: {
          in: [transferId, planId, successfulExecutionId],
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
