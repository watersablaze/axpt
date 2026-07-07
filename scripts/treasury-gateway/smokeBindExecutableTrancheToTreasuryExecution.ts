import assert from "node:assert/strict";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import { applyTreasuryTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";

import { applyTreasuryTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferCapacityAssessment";

import { applyTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/transfers/applyTreasuryExecutionPlan";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import { applyExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/execution-plans/applyExecutableTrancheEligibilityAssessment";

import { createTreasuryExecutionFromEligibleTranche } from "../../src/domains/treasury/gateway/execution-plans/createTreasuryExecutionFromEligibleTranche";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { recordExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/recordExecutableTrancheEligibilityAssessment";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/contracts";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { bindExecutableTrancheToTreasuryExecution } from "../../src/domains/treasury/gateway/execution-plans/bindExecutableTrancheToTreasuryExecution";

import { EXECUTABLE_TRANCHE_STATUS } from "../../src/domains/treasury/gateway/execution-plans/status";

const correlationId = "correlation-execution-instantiation-smoke-001";

const createdTransfer = createTreasuryTransfer({
  transferId: "transfer-execution-instantiation-smoke-001",

  reference: "AXPT-TXFR-EXEC-INSTANTIATION-001",

  command: {
    context: {
      commandId: "command-create-transfer-execution-instantiation-smoke-001",

      actorId: "actor-transfer-creator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:00:00.000Z"),

      idempotencyKey: "create-transfer-execution-instantiation-smoke-001",
    },

    payload: {
      programId: "program-execution-instantiation-smoke-001",

      instructionId: "instruction-execution-instantiation-smoke-001",

      source: {
        kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

        programAccountId: "program-account-execution-instantiation-smoke-001",
      },

      destination: {
        kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

        settlementEndpointId:
          "settlement-endpoint-execution-instantiation-smoke-001",
      },

      requestedAmount: {
        amount: "400000000.00",

        currency: "USD",
      },

      destinationCurrency: "EUR",

      purpose: "Program capitalization",
    },
  },
});

const authorityReview = beginTreasuryTransferAuthorityReview(
  createdTransfer.aggregate,

  {
    context: {
      commandId: "command-authority-review-execution-instantiation-smoke-001",

      actorId: "actor-authority-reviewer",

      correlationId,

      requestedAt: new Date("2026-07-06T15:01:00.000Z"),

      idempotencyKey: "authority-review-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: createdTransfer.aggregate.id,
    },
  },
);

const authorityAssessment = recordTransferAuthorityAssessment({
  assessmentId: "authority-assessment-execution-instantiation-smoke-001",

  command: {
    context: {
      commandId:
        "command-authority-assessment-execution-instantiation-smoke-001",

      actorId: "actor-authority-assessor",

      correlationId,

      requestedAt: new Date("2026-07-06T15:02:00.000Z"),

      idempotencyKey: "authority-assessment-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: authorityReview.aggregate.id,

      result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

      evidenceArtifactIds: [
        "artifact-authority-execution-instantiation-smoke-001",
      ],

      assessedAt: new Date("2026-07-06T15:01:30.000Z"),
    },
  },
});

const authorizedTransfer = applyTreasuryTransferAuthorityAssessment(
  authorityReview.aggregate,

  authorityAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-authority-execution-instantiation-smoke-001",

      actorId: "actor-authority-outcome-operator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:03:00.000Z"),

      idempotencyKey: "apply-authority-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: authorityReview.aggregate.id,

      assessmentId: authorityAssessment.aggregate.id,
    },
  },
);

const capacityAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-execution-instantiation-smoke-001",

  command: {
    context: {
      commandId:
        "command-capacity-assessment-execution-instantiation-smoke-001",

      actorId: "actor-capacity-assessor",

      correlationId,

      requestedAt: new Date("2026-07-06T15:04:00.000Z"),

      idempotencyKey: "capacity-assessment-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: authorizedTransfer.aggregate.id,

      requestedAmount: authorizedTransfer.aggregate.requestedAmount,

      constraints: [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "400000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: [
            "rail-capacity-execution-instantiation-smoke-001",
          ],
        },
      ],

      assessedAt: new Date("2026-07-06T15:03:30.000Z"),
    },
  },
});

const capacityAssessedTransfer = applyTreasuryTransferCapacityAssessment(
  authorizedTransfer.aggregate,

  capacityAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-capacity-execution-instantiation-smoke-001",

      actorId: "actor-capacity-outcome-operator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:05:00.000Z"),

      idempotencyKey: "apply-capacity-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: authorizedTransfer.aggregate.id,

      assessmentId: capacityAssessment.aggregate.id,
    },
  },
);

const recordedPlan = recordTreasuryExecutionPlan({
  planId: "execution-plan-instantiation-smoke-001",

  capacityAssessment: capacityAssessment.aggregate,

  command: {
    context: {
      commandId: "command-record-plan-execution-instantiation-smoke-001",

      actorId: "actor-execution-planner",

      correlationId,

      requestedAt: new Date("2026-07-06T15:06:00.000Z"),

      idempotencyKey: "record-plan-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: capacityAssessedTransfer.aggregate.id,

      capacityAssessmentId: capacityAssessment.aggregate.id,

      plannedAmount: {
        amount: "400000000.00",

        currency: "USD",
      },

      destinationCurrency: "EUR",

      tranches: [
        {
          trancheId: "tranche-execution-instantiation-smoke-001",

          sequence: 1,

          amount: {
            amount: "400000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-execution-instantiation-smoke-001",

          instructionId: "instruction-execution-instantiation-smoke-001",

          beneficiaryProfileId: "beneficiary-execution-instantiation-smoke-001",

          settlementEndpointId:
            "settlement-endpoint-execution-instantiation-smoke-001",

          purpose: "Program capitalization tranche",
        },
      ],

      plannedAt: new Date("2026-07-06T15:05:30.000Z"),
    },
  },
});

const plannedTransfer = applyTreasuryExecutionPlan(
  capacityAssessedTransfer.aggregate,

  recordedPlan.aggregate,

  {
    context: {
      commandId: "command-apply-plan-execution-instantiation-smoke-001",

      actorId: "actor-plan-outcome-operator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:07:00.000Z"),

      idempotencyKey: "apply-plan-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: capacityAssessedTransfer.aggregate.id,

      planId: recordedPlan.aggregate.id,
    },
  },
);

const eligibilityAssessment = recordExecutableTrancheEligibilityAssessment({
  assessmentId:
    "tranche-eligibility-assessment-execution-instantiation-smoke-001",

  plan: recordedPlan.aggregate,

  command: {
    context: {
      commandId: "command-record-eligibility-execution-instantiation-smoke-001",

      actorId: "actor-tranche-eligibility-assessor",

      correlationId,

      requestedAt: new Date("2026-07-06T15:08:00.000Z"),

      idempotencyKey: "record-eligibility-execution-instantiation-smoke-001",
    },

    payload: {
      transferId: plannedTransfer.aggregate.id,

      planId: recordedPlan.aggregate.id,

      trancheId: "tranche-execution-instantiation-smoke-001",

      result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

      evidenceArtifactIds: [
        "artifact-eligibility-execution-instantiation-smoke-001",
      ],

      assessedAt: new Date("2026-07-06T15:07:30.000Z"),
    },
  },
});

const eligiblePlan = applyExecutableTrancheEligibilityAssessment(
  recordedPlan.aggregate,

  eligibilityAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-eligibility-execution-instantiation-smoke-001",

      actorId: "actor-tranche-eligibility-outcome-operator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:09:00.000Z"),

      idempotencyKey: "apply-eligibility-execution-instantiation-smoke-001",
    },

    payload: {
      planId: recordedPlan.aggregate.id,

      assessmentId: eligibilityAssessment.aggregate.id,
    },
  },
);

const createdExecution = createTreasuryExecutionFromEligibleTranche({
  executionId: "execution-instantiation-smoke-001",

  reference: "AXPT-EXEC-2026-001",

  transfer: plannedTransfer.aggregate,

  plan: eligiblePlan.aggregate,

  command: {
    context: {
      commandId: "command-create-execution-from-tranche-smoke-001",

      actorId: "actor-execution-instantiator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:10:00.000Z"),

      idempotencyKey: "create-execution-from-tranche-smoke-001",
    },

    payload: {
      transferId: plannedTransfer.aggregate.id,

      planId: eligiblePlan.aggregate.id,

      trancheId: "tranche-execution-instantiation-smoke-001",
    },
  },
});

const bound = bindExecutableTrancheToTreasuryExecution(
  eligiblePlan.aggregate,

  createdExecution.aggregate,

  {
    context: {
      commandId: "command-bind-execution-to-tranche-smoke-001",

      actorId: "actor-execution-binding-operator",

      correlationId,

      requestedAt: new Date("2026-07-06T15:11:00.000Z"),

      idempotencyKey: "bind-execution-to-tranche-smoke-001",
    },

    payload: {
      planId: eligiblePlan.aggregate.id,

      trancheId: "tranche-execution-instantiation-smoke-001",

      executionId: createdExecution.aggregate.id,
    },
  },
);

assert.equal(
  bound.aggregate.tranches[0]?.status,

  EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,
);

assert.equal(
  bound.aggregate.tranches[0]?.executionId,

  createdExecution.aggregate.id,
);

assert.equal(
  bound.aggregate.metadata.version,

  eligiblePlan.aggregate.metadata.version + 1,
);

assert.equal(
  bound.event.eventType,

  TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_BOUND_TO_EXECUTION,
);

assert.equal(
  bound.event.payload.executionId,

  createdExecution.aggregate.id,
);

assert.equal(
  createdExecution.aggregate.status,

  TREASURY_EXECUTION_STATUS.CREATED,
);

assert.equal(
  createdExecution.aggregate.programId,

  plannedTransfer.aggregate.programId,
);

assert.equal(
  createdExecution.aggregate.allocationId,

  eligiblePlan.aggregate.tranches[0]?.allocationId,
);

assert.equal(
  createdExecution.aggregate.kind,

  eligiblePlan.aggregate.tranches[0]?.executionKind,
);

assert.deepEqual(
  createdExecution.aggregate.amount,

  eligiblePlan.aggregate.tranches[0]?.amount,
);

assert.equal(
  createdExecution.aggregate.settlementEndpointId,

  eligiblePlan.aggregate.tranches[0]?.settlementEndpointId,
);

assert.equal(
  createdExecution.aggregate.purpose,

  eligiblePlan.aggregate.tranches[0]?.purpose,
);

assert.throws(
  () =>
    bindExecutableTrancheToTreasuryExecution(
      bound.aggregate,

      createdExecution.aggregate,

      {
        context: {
          commandId: "command-repeat-bind-execution-to-tranche-smoke-001",

          actorId: "actor-execution-binding-operator",

          correlationId,

          requestedAt: new Date("2026-07-06T15:12:00.000Z"),

          idempotencyKey: "repeat-bind-execution-to-tranche-smoke-001",
        },

        payload: {
          planId: bound.aggregate.id,

          trancheId: "tranche-execution-instantiation-smoke-001",

          executionId: createdExecution.aggregate.id,
        },
      },
    ),

  /EXECUTABLE_TRANCHE_BINDING_TRANCHE_NOT_ELIGIBLE/,
);

assert.throws(
  () =>
    bindExecutableTrancheToTreasuryExecution(
      eligiblePlan.aggregate,

      {
        ...createdExecution.aggregate,

        allocationId: "different-allocation-id",
      },

      {
        context: {
          commandId: "command-bind-mismatched-allocation-smoke-001",

          actorId: "actor-execution-binding-operator",

          correlationId,

          requestedAt: new Date("2026-07-06T15:13:00.000Z"),

          idempotencyKey: "bind-mismatched-allocation-smoke-001",
        },

        payload: {
          planId: eligiblePlan.aggregate.id,

          trancheId: "tranche-execution-instantiation-smoke-001",

          executionId: createdExecution.aggregate.id,
        },
      },
    ),

  /EXECUTABLE_TRANCHE_BINDING_ALLOCATION_MISMATCH/,
);

assert.throws(
  () =>
    bindExecutableTrancheToTreasuryExecution(
      eligiblePlan.aggregate,

      {
        ...createdExecution.aggregate,

        status: TREASURY_EXECUTION_STATUS.VALIDATING,
      },

      {
        context: {
          commandId: "command-bind-non-created-execution-smoke-001",

          actorId: "actor-execution-binding-operator",

          correlationId,

          requestedAt: new Date("2026-07-06T15:14:00.000Z"),

          idempotencyKey: "bind-non-created-execution-smoke-001",
        },

        payload: {
          planId: eligiblePlan.aggregate.id,

          trancheId: "tranche-execution-instantiation-smoke-001",

          executionId: createdExecution.aggregate.id,
        },
      },
    ),

  /EXECUTABLE_TRANCHE_BINDING_EXECUTION_NOT_CREATED/,
);

console.log(
  "✓ Executable Tranche binding to Treasury Execution smoke test passed",
);

console.log({
  tranche: {
    id: bound.aggregate.tranches[0]?.id,

    status: bound.aggregate.tranches[0]?.status,

    executionId: bound.aggregate.tranches[0]?.executionId,
  },

  execution: {
    id: createdExecution.aggregate.id,

    status: createdExecution.aggregate.status,
  },

  plan: {
    status: bound.aggregate.status,

    version: bound.aggregate.metadata.version,
  },

  invariants: {
    exactEligibleTrancheRequired: true,

    createdExecutionRequired: true,

    executionFactsMustMatchTranche: true,

    executionIdentityRetainedOnTranche: true,

    repeatBindingRejected: true,

    oneTrancheOneExecution: true,
  },
});
