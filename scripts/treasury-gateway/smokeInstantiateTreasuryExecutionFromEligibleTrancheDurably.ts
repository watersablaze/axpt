import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient";

import { executeDurableTreasuryExecutionPlanTransitionWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/executeDurableTreasuryExecutionPlanTransitionWithClient";

import { applyExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/execution-plans/applyExecutableTrancheEligibilityAssessment";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import type { ExecutableTranche } from "../../src/domains/treasury/gateway/execution-plans/contracts";

import { loadTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import { persistNewTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/persistNewTreasuryExecutionPlanWithClient";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

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

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

const prisma = new PrismaClient();

function assertError(error: unknown): void {
  assert(error instanceof Error);
}

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

  const rolledBackExecutionId = `smoke-mesh-execution-rollback-${fixtureId}`;

  const successfulExecutionEventId = `smoke-mesh-execution-success-event-${fixtureId}`;

  const successfulBindingEventId = `smoke-mesh-binding-success-event-${fixtureId}`;

  const rolledBackExecutionEventId = `smoke-mesh-execution-rollback-event-${fixtureId}`;

  const conflictingBindingEventId = `smoke-mesh-binding-conflict-event-${fixtureId}`;

  const conflictSeedAggregateId = `smoke-mesh-conflict-seed-${fixtureId}`;

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

    /*
     * Seed an event-ID conflict.
     *
     * The failed instantiation will persist its new execution first,
     * update the plan second, then fail while appending the binding
     * event. The outer Prisma transaction must erase all of it.
     */
    await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: conflictingBindingEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: conflictSeedAggregateId,

        aggregateVersion: 1,

        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,

        actorId: `smoke-mesh-conflict-seed-actor-${fixtureId}`,

        correlationId,

        payload: {
          fixtureId,

          purpose: "Force binding-event persistence failure",
        },

        occurredAt: new Date(),
      },
    });

    let rollbackError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient({
          transferId,

          planId,

          trancheId: secondTrancheId,

          executionId: rolledBackExecutionId,

          executionReference: `AXPT-MESH-EXECUTION-ROLLBACK-${fixtureId}`,

          executionCreatedEventId: rolledBackExecutionEventId,

          trancheBoundEventId: conflictingBindingEventId,

          context: {
            ...baseContext,

            commandId: `smoke-mesh-instantiate-rollback-${fixtureId}`,

            actorId: `smoke-mesh-instantiator-${fixtureId}`,

            idempotencyKey: `smoke-mesh-instantiate-rollback-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      rollbackError = error;
    }

    assertError(rollbackError);

    /*
     * The failed execution must not exist.
     */
    const rolledBackExecution = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: rolledBackExecutionId,

          client: tx,
        }),
    );

    assert.equal(rolledBackExecution, null);

    const rolledBackExecutionEventCount =
      await prisma.treasuryGatewayEvent.count({
        where: {
          eventId: rolledBackExecutionEventId,
        },
      });

    assert.equal(rolledBackExecutionEventCount, 0);

    /*
     * The plan must remain at v4.
     * Tranche 002 must remain ELIGIBLE and unbound.
     */
    const finalPlan = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionPlanWithClient({
        planId,

        client: tx,
      }),
    );

    assert(finalPlan);

    assert.equal(
      finalPlan.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(finalPlan.aggregate.metadata.version, 4);

    const finalFirstTranche = finalPlan.aggregate.tranches.find(
      (tranche: ExecutableTranche) => tranche.id === firstTrancheId,
    );

    const finalSecondTranche = finalPlan.aggregate.tranches.find(
      (tranche: ExecutableTranche) => tranche.id === secondTrancheId,
    );

    assert(finalFirstTranche);

    assert(finalSecondTranche);

    assert.equal(
      finalFirstTranche.status,
      EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,
    );

    assert.equal(finalFirstTranche.executionId, successfulExecutionId);

    assert.equal(finalSecondTranche.status, EXECUTABLE_TRANCHE_STATUS.ELIGIBLE);

    assert.equal(finalSecondTranche.executionId, undefined);

    /*
     * Confirm the successful execution remains durable.
     */
    const finalSuccessfulExecution = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: successfulExecutionId,

          client: tx,
        }),
    );

    assert(finalSuccessfulExecution);

    assert.equal(finalSuccessfulExecution.aggregate.id, successfulExecutionId);

    assert.equal(
      finalSuccessfulExecution.aggregate.allocationId,
      finalFirstTranche.allocationId,
    );

    assert.deepEqual(
      finalSuccessfulExecution.aggregate.amount,
      finalFirstTranche.amount,
    );

    console.log("✓ Atomic Treasury Execution instantiation smoke test passed");

    console.log({
      transfer: {
        id: transferId,

        status: TREASURY_TRANSFER_STATUS.PLANNED,
      },

      plan: {
        id: planId,

        status: finalPlan.aggregate.status,

        version: finalPlan.aggregate.metadata.version,
      },

      successfulMesh: {
        trancheId: finalFirstTranche.id,

        trancheStatus: finalFirstTranche.status,

        executionId: finalSuccessfulExecution.aggregate.id,

        executionStatus: finalSuccessfulExecution.aggregate.status,
      },

      rolledBackMesh: {
        trancheId: finalSecondTranche.id,

        trancheStatus: finalSecondTranche.status,

        executionId: rolledBackExecutionId,

        executionExists: false,
      },

      invariants: {
        plannedTransferRequired: true,

        recordedPlanRequired: true,

        eligibleTrancheRequired: true,

        executionFactsInheritedFromTranche: true,

        successfulExecutionPersisted: true,

        successfulTrancheBindingPersisted: true,

        executionAndBindingCommittedTogether: true,

        secondHalfFailureTriggeredRollback: true,

        rolledBackExecutionDoesNotExist: true,

        rolledBackExecutionEventDoesNotExist: true,

        failedTrancheRemainsEligible: true,

        failedTrancheRemainsUnbound: true,

        planVersionNotAdvancedByFailedMesh: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        OR: [
          {
            aggregateId: {
              in: [
                transferId,
                planId,
                successfulExecutionId,
                rolledBackExecutionId,
                conflictSeedAggregateId,
              ],
            },
          },

          {
            eventId: {
              in: [
                successfulExecutionEventId,
                successfulBindingEventId,
                rolledBackExecutionEventId,
                conflictingBindingEventId,
              ],
            },
          },
        ],
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateId: {
          in: [
            transferId,
            planId,
            successfulExecutionId,
            rolledBackExecutionId,
          ],
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
