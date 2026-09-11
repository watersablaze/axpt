import { type TransactionClient } from "@prisma/client";

import { createTreasuryAllocationIdempotentlyWithClient } from "../../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationIdempotentlyWithClient";
import { submitTreasuryAllocationForReviewDurablyWithClient } from "../../../src/domains/treasury/gateway/allocations/application/submitTreasuryAllocationForReviewDurablyWithClient";
import { approveTreasuryAllocationDurablyWithClient } from "../../../src/domains/treasury/gateway/allocations/application/approveTreasuryAllocationDurablyWithClient";
import { activateTreasuryAllocationDurablyWithClient } from "../../../src/domains/treasury/gateway/allocations/application/activateTreasuryAllocationDurablyWithClient";
import { TREASURY_ALLOCATION_PURPOSE } from "../../../src/domains/treasury/gateway/allocations/contracts";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";
import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";
import { authorizeTreasuryExecutionDurablyWithClient } from "../../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";
import { TREASURY_EXECUTION_KIND } from "../../../src/domains/treasury/gateway/executions/contracts";

import { instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient } from "../../../src/domains/treasury/gateway/execution-plans/application/instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient";
import { executeDurableTreasuryExecutionPlanTransitionWithClient } from "../../../src/domains/treasury/gateway/execution-plans/application/executeDurableTreasuryExecutionPlanTransitionWithClient";
import { applyExecutableTrancheEligibilityAssessment } from "../../../src/domains/treasury/gateway/execution-plans/applyExecutableTrancheEligibilityAssessment";
import { recordTreasuryExecutionPlan } from "../../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";
import { persistNewTreasuryExecutionPlanWithClient } from "../../../src/domains/treasury/gateway/execution-plans/persistence/persistNewTreasuryExecutionPlanWithClient";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/contracts";
import { recordExecutableTrancheEligibilityAssessment } from "../../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/recordExecutableTrancheEligibilityAssessment";

import { executeDurableTreasuryTransferTransitionWithClient } from "../../../src/domains/treasury/gateway/transfers/application/executeDurableTreasuryTransferTransitionWithClient";
import { applyTreasuryExecutionPlan } from "../../../src/domains/treasury/gateway/transfers/applyTreasuryExecutionPlan";
import { applyTreasuryTransferAuthorityAssessment } from "../../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";
import { applyTreasuryTransferCapacityAssessment } from "../../../src/domains/treasury/gateway/transfers/applyTreasuryTransferCapacityAssessment";
import { beginTreasuryTransferAuthorityReview } from "../../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";
import { createTreasuryTransfer } from "../../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";
import { TREASURY_TRANSFER_LOCATION_KIND } from "../../../src/domains/treasury/gateway/transfers/contracts";
import { persistNewTreasuryTransferWithClient } from "../../../src/domains/treasury/gateway/transfers/persistence/persistNewTreasuryTransferWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";
import { recordTransferAuthorityAssessment } from "../../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";
import { recordTransferCapacityAssessment } from "../../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

export async function establishGovernedAuthorizedTreasuryExecutionFixture(params: {
  fixtureId: string;
  executionId: string;
  settlementEndpointId: string;
  amount: string;
  currency?: string;
  purpose: string;
  sharedAllocation?: Readonly<{
    allocationId: string;
    programId: string;
    sourceProgramAccountId: string;
  }>;
  client: TransactionClient;
}) {
  const {
    fixtureId,
    executionId,
    settlementEndpointId,
    amount,
    currency = "USD",
    purpose,
    sharedAllocation,
    client,
  } = params;

  const transferId = `transfer-${fixtureId}`;
  const authorityAssessmentId = `authority-assessment-${fixtureId}`;
  const capacityAssessmentId = `capacity-assessment-${fixtureId}`;
  const planId = `plan-${fixtureId}`;
  const trancheId = `tranche-${fixtureId}`;
  const eligibilityAssessmentId = `eligibility-${fixtureId}`;
  const allocationId =
    sharedAllocation?.allocationId ?? `allocation-${fixtureId}`;
  const programId = sharedAllocation?.programId ?? `program-${fixtureId}`;
  const sourceProgramAccountId =
    sharedAllocation?.sourceProgramAccountId ?? `program-account-${fixtureId}`;
  const instructionId = `instruction-${fixtureId}`;

  const baseContext = {
    commandId: `command-${fixtureId}`,
    actorId: `actor-${fixtureId}`,
    correlationId: `correlation-${fixtureId}`,
    requestedAt: new Date(),
    idempotencyKey: `fixture-${fixtureId}`,
  };

  const money = {
    amount,
    currency,
  };

  const createdTransfer = createTreasuryTransfer({
    transferId,
    reference: `FIXTURE-TRANSFER-${fixtureId}`,
    command: {
      context: {
        ...baseContext,
        commandId: `create-transfer-${fixtureId}`,
        idempotencyKey: `create-transfer-${fixtureId}`,
      },
      payload: {
        programId,
        instructionId,
        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,
          programAccountId: sourceProgramAccountId,
        },
        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,
          settlementEndpointId,
        },
        requestedAmount: money,
        destinationCurrency: currency,
        purpose,
      },
    },
  });

  await persistNewTreasuryTransferWithClient({
    result: createdTransfer,
    eventId: `event-transfer-created-${fixtureId}`,
    context: createdTransfer.aggregate.metadata
      ? {
          ...baseContext,
          commandId: `create-transfer-${fixtureId}`,
          idempotencyKey: `create-transfer-${fixtureId}`,
        }
      : baseContext,
    client,
  });

  await executeDurableTreasuryTransferTransitionWithClient({
    transferId,
    eventId: `event-authority-review-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `authority-review-${fixtureId}`,
      idempotencyKey: `authority-review-${fixtureId}`,
    },
    client,
    apply: (aggregate) =>
      beginTreasuryTransferAuthorityReview(aggregate, {
        context: {
          ...baseContext,
          commandId: `authority-review-${fixtureId}`,
          idempotencyKey: `authority-review-${fixtureId}`,
        },
        payload: { transferId },
      }),
  });

  const authorityAssessment = recordTransferAuthorityAssessment({
    assessmentId: authorityAssessmentId,
    command: {
      context: {
        ...baseContext,
        commandId: `record-authority-${fixtureId}`,
        idempotencyKey: `record-authority-${fixtureId}`,
      },
      payload: {
        transferId,
        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
        evidenceArtifactIds: [`authority-evidence-${fixtureId}`],
        assessedAt: new Date(),
      },
    },
  });

  await executeDurableTreasuryTransferTransitionWithClient({
    transferId,
    eventId: `event-authority-applied-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `apply-authority-${fixtureId}`,
      idempotencyKey: `apply-authority-${fixtureId}`,
    },
    client,
    apply: (aggregate) =>
      applyTreasuryTransferAuthorityAssessment(
        aggregate,
        authorityAssessment.aggregate,
        {
          context: {
            ...baseContext,
            commandId: `apply-authority-${fixtureId}`,
            idempotencyKey: `apply-authority-${fixtureId}`,
          },
          payload: {
            transferId,
            assessmentId: authorityAssessmentId,
          },
        },
      ),
  });

  const capacityAssessment = recordTransferCapacityAssessment({
    assessmentId: capacityAssessmentId,
    command: {
      context: {
        ...baseContext,
        commandId: `record-capacity-${fixtureId}`,
        idempotencyKey: `record-capacity-${fixtureId}`,
      },
      payload: {
        transferId,
        requestedAmount: money,
        constraints: [
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,
            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,
            limit: money,
            evidenceReferenceIds: [`capacity-evidence-${fixtureId}`],
          },
        ],
        assessedAt: new Date(),
      },
    },
  });

  await executeDurableTreasuryTransferTransitionWithClient({
    transferId,
    eventId: `event-capacity-applied-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `apply-capacity-${fixtureId}`,
      idempotencyKey: `apply-capacity-${fixtureId}`,
    },
    client,
    apply: (aggregate) =>
      applyTreasuryTransferCapacityAssessment(
        aggregate,
        capacityAssessment.aggregate,
        {
          context: {
            ...baseContext,
            commandId: `apply-capacity-${fixtureId}`,
            idempotencyKey: `apply-capacity-${fixtureId}`,
          },
          payload: {
            transferId,
            assessmentId: capacityAssessmentId,
          },
        },
      ),
  });

  if (!sharedAllocation) {
    await createTreasuryAllocationIdempotentlyWithClient({
      request: {
        allocationId,
        reference: `FIXTURE-ALLOCATION-${fixtureId}`,
        eventId: `event-allocation-created-${fixtureId}`,
        context: {
          ...baseContext,
          commandId: `create-allocation-${fixtureId}`,
          idempotencyKey: `create-allocation-${fixtureId}`,
        },
        payload: {
          programId,
          sourceProgramAccountId,
          purposeType: TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,
          amount: money,
        },
      },
      client,
    });

    await submitTreasuryAllocationForReviewDurablyWithClient({
      allocationId,
      eventId: `event-allocation-review-${fixtureId}`,
      context: {
        ...baseContext,
        commandId: `review-allocation-${fixtureId}`,
        idempotencyKey: `review-allocation-${fixtureId}`,
      },
      client,
    });

    await approveTreasuryAllocationDurablyWithClient({
      allocationId,
      approvalIds: [`allocation-approval-${fixtureId}`],
      eventId: `event-allocation-approved-${fixtureId}`,
      context: {
        ...baseContext,
        commandId: `approve-allocation-${fixtureId}`,
        idempotencyKey: `approve-allocation-${fixtureId}`,
      },
      client,
    });

    await activateTreasuryAllocationDurablyWithClient({
      allocationId,
      eventId: `event-allocation-activated-${fixtureId}`,
      context: {
        ...baseContext,
        commandId: `activate-allocation-${fixtureId}`,
        idempotencyKey: `activate-allocation-${fixtureId}`,
      },
      client,
    });
  }

  const recordedPlan = recordTreasuryExecutionPlan({
    planId,
    capacityAssessment: capacityAssessment.aggregate,
    command: {
      context: {
        ...baseContext,
        commandId: `record-plan-${fixtureId}`,
        actorId: `planner-${fixtureId}`,
        idempotencyKey: `record-plan-${fixtureId}`,
      },
      payload: {
        transferId,
        capacityAssessmentId,
        plannedAmount: money,
        destinationCurrency: currency,
        tranches: [
          {
            trancheId,
            sequence: 1,
            amount: money,
            executionKind: TREASURY_EXECUTION_KIND.BENEFICIARY_DISTRIBUTION,
            allocationId,
            instructionId,
            beneficiaryProfileId: `beneficiary-${fixtureId}`,
            settlementEndpointId,
            purpose,
          },
        ],
        plannedAt: new Date(),
      },
    },
  });

  await persistNewTreasuryExecutionPlanWithClient({
    result: recordedPlan,
    eventId: `event-plan-recorded-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `record-plan-${fixtureId}`,
      idempotencyKey: `record-plan-${fixtureId}`,
    },
    client,
  });

  await executeDurableTreasuryTransferTransitionWithClient({
    transferId,
    eventId: `event-plan-applied-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `apply-plan-${fixtureId}`,
      idempotencyKey: `apply-plan-${fixtureId}`,
    },
    client,
    apply: (aggregate) =>
      applyTreasuryExecutionPlan(aggregate, recordedPlan.aggregate, {
        context: {
          ...baseContext,
          commandId: `apply-plan-${fixtureId}`,
          idempotencyKey: `apply-plan-${fixtureId}`,
        },
        payload: {
          transferId,
          planId,
        },
      }),
  });

  const eligibilityAssessment = recordExecutableTrancheEligibilityAssessment({
    assessmentId: eligibilityAssessmentId,
    plan: recordedPlan.aggregate,
    command: {
      context: {
        ...baseContext,
        commandId: `record-eligibility-${fixtureId}`,
        idempotencyKey: `record-eligibility-${fixtureId}`,
      },
      payload: {
        transferId,
        planId,
        trancheId,
        result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,
        evidenceArtifactIds: [`eligibility-evidence-${fixtureId}`],
        assessedAt: new Date(),
      },
    },
  });

  await executeDurableTreasuryExecutionPlanTransitionWithClient({
    planId,
    eventId: `event-eligibility-applied-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `apply-eligibility-${fixtureId}`,
      idempotencyKey: `apply-eligibility-${fixtureId}`,
    },
    client,
    apply: (aggregate) =>
      applyExecutableTrancheEligibilityAssessment(
        aggregate,
        eligibilityAssessment.aggregate,
        {
          context: {
            ...baseContext,
            commandId: `apply-eligibility-${fixtureId}`,
            idempotencyKey: `apply-eligibility-${fixtureId}`,
          },
          payload: {
            planId,
            assessmentId: eligibilityAssessmentId,
          },
        },
      ),
  });

  await instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient({
    transferId,
    planId,
    trancheId,
    executionId,
    executionReference: `FIXTURE-EXECUTION-${fixtureId}`,
    executionCreatedEventId: `event-execution-created-${fixtureId}`,
    trancheBoundEventId: `event-tranche-bound-${fixtureId}`,
    context: {
      ...baseContext,
      commandId: `instantiate-execution-${fixtureId}`,
      idempotencyKey: `instantiate-execution-${fixtureId}`,
    },
    client,
  });

  await beginTreasuryExecutionValidationDurablyWithClient({
    command: {
      context: {
        ...baseContext,
        commandId: `validate-execution-${fixtureId}`,
        idempotencyKey: `validate-execution-${fixtureId}`,
      },
      payload: { executionId },
    },
    eventId: `event-execution-validation-${fixtureId}`,
    client,
  });

  await markTreasuryExecutionReadyForAuthorizationDurablyWithClient({
    command: {
      context: {
        ...baseContext,
        commandId: `ready-execution-${fixtureId}`,
        idempotencyKey: `ready-execution-${fixtureId}`,
      },
      payload: { executionId },
    },
    eventId: `event-execution-ready-${fixtureId}`,
    client,
  });

  const authorized = await authorizeTreasuryExecutionDurablyWithClient({
    command: {
      context: {
        ...baseContext,
        commandId: `authorize-execution-${fixtureId}`,
        authorityGrantId: `authority-grant-${fixtureId}`,
        idempotencyKey: `authorize-execution-${fixtureId}`,
      },
      payload: {
        executionId,
        approvalIds: [`execution-approval-${fixtureId}`],
      },
    },
    eventId: `event-execution-authorized-${fixtureId}`,
    client,
  });

  return {
    execution: authorized.aggregate,
    executionId,
    transferId,
    authorityAssessmentId,
    capacityAssessmentId,
    eligibilityAssessmentId,
    planId,
    trancheId,
    allocationId,
    programId,
    sourceProgramAccountId,
    settlementEndpointId,
  };
}
