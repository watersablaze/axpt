import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/recordExecutableTrancheEligibilityAssessment";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/contracts";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

const capacityAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-tranche-eligibility-smoke-001",

  command: {
    context: {
      commandId: "command-capacity-tranche-eligibility-smoke-001",

      actorId: "actor-capacity-assessor",

      correlationId: "correlation-tranche-eligibility-smoke-001",

      requestedAt: new Date("2026-07-06T13:00:00.000Z"),

      idempotencyKey: "capacity-tranche-eligibility-smoke-001",
    },

    payload: {
      transferId: "transfer-tranche-eligibility-smoke-001",

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

          evidenceReferenceIds: ["rail-capacity-tranche-eligibility-smoke-001"],
        },
      ],

      assessedAt: new Date("2026-07-06T12:59:00.000Z"),
    },
  },
}).aggregate;

const plan = recordTreasuryExecutionPlan({
  planId: "execution-plan-tranche-eligibility-smoke-001",

  capacityAssessment,

  command: {
    context: {
      commandId: "command-plan-tranche-eligibility-smoke-001",

      actorId: "actor-execution-planner",

      correlationId: "correlation-tranche-eligibility-smoke-001",

      requestedAt: new Date("2026-07-06T13:01:00.000Z"),

      idempotencyKey: "plan-tranche-eligibility-smoke-001",
    },

    payload: {
      transferId: capacityAssessment.transferId,

      capacityAssessmentId: capacityAssessment.id,

      plannedAmount: {
        amount: "400000000.00",

        currency: "USD",
      },

      destinationCurrency: "EUR",

      tranches: [
        {
          trancheId: "tranche-eligibility-smoke-001",

          sequence: 1,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-tranche-eligibility-smoke-001",

          instructionId: "instruction-tranche-eligibility-smoke-001",

          settlementEndpointId:
            "settlement-endpoint-tranche-eligibility-smoke-001",

          purpose: "Program capitalization tranche",
        },

        {
          trancheId: "tranche-eligibility-smoke-002",

          sequence: 2,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-tranche-eligibility-smoke-002",

          instructionId: "instruction-tranche-eligibility-smoke-001",

          settlementEndpointId:
            "settlement-endpoint-tranche-eligibility-smoke-001",

          purpose: "Program capitalization tranche",
        },
      ],

      plannedAt: new Date("2026-07-06T13:00:30.000Z"),
    },
  },
}).aggregate;

assert.equal(
  plan.status,

  TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
);

assert.equal(
  plan.tranches[0]?.status,

  EXECUTABLE_TRANCHE_STATUS.PLANNED,
);

const assessment = recordExecutableTrancheEligibilityAssessment({
  assessmentId: "tranche-eligibility-assessment-smoke-001",

  plan,

  command: {
    context: {
      commandId: "command-record-tranche-eligibility-smoke-001",

      actorId: "actor-tranche-eligibility-assessor",

      correlationId: "correlation-tranche-eligibility-smoke-001",

      requestedAt: new Date("2026-07-06T13:02:00.000Z"),

      idempotencyKey: "record-tranche-eligibility-smoke-001",
    },

    payload: {
      transferId: plan.transferId,

      planId: plan.id,

      trancheId: "tranche-eligibility-smoke-001",

      result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

      evidenceArtifactIds: ["artifact-tranche-eligibility-smoke-001"],

      assessedAt: new Date("2026-07-06T13:01:30.000Z"),

      notes: "Planned tranche is eligible to request execution instantiation.",
    },
  },
});

assert.equal(
  assessment.aggregate.result,

  EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,
);

assert.equal(
  assessment.aggregate.transferId,

  plan.transferId,
);

assert.equal(
  assessment.aggregate.planId,

  plan.id,
);

assert.equal(
  assessment.aggregate.trancheId,

  "tranche-eligibility-smoke-001",
);

assert.equal(
  assessment.aggregate.metadata.version,

  1,
);

assert.equal(
  assessment.event.eventType,

  TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_ASSESSMENT_RECORDED,
);

assert.throws(
  () =>
    recordExecutableTrancheEligibilityAssessment({
      assessmentId: "tranche-eligibility-assessment-smoke-missing",

      plan,

      command: {
        context: {
          commandId: "command-record-tranche-eligibility-missing",

          actorId: "actor-tranche-eligibility-assessor",

          correlationId: "correlation-tranche-eligibility-missing",

          requestedAt: new Date("2026-07-06T13:03:00.000Z"),

          idempotencyKey: "record-tranche-eligibility-missing",
        },

        payload: {
          transferId: plan.transferId,

          planId: plan.id,

          trancheId: "missing-tranche-id",

          result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

          evidenceArtifactIds: [],

          assessedAt: new Date("2026-07-06T13:02:30.000Z"),
        },
      },
    }),

  /EXECUTABLE_TRANCHE_ELIGIBILITY_TRANCHE_NOT_FOUND/,
);

assert.throws(
  () =>
    recordExecutableTrancheEligibilityAssessment({
      assessmentId: "tranche-eligibility-assessment-smoke-transfer-mismatch",

      plan,

      command: {
        context: {
          commandId: "command-record-tranche-eligibility-transfer-mismatch",

          actorId: "actor-tranche-eligibility-assessor",

          correlationId: "correlation-tranche-eligibility-transfer-mismatch",

          requestedAt: new Date("2026-07-06T13:04:00.000Z"),

          idempotencyKey: "record-tranche-eligibility-transfer-mismatch",
        },

        payload: {
          transferId: "different-transfer-id",

          planId: plan.id,

          trancheId: "tranche-eligibility-smoke-001",

          result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,

          evidenceArtifactIds: [],

          assessedAt: new Date("2026-07-06T13:03:30.000Z"),
        },
      },
    }),

  /EXECUTABLE_TRANCHE_ELIGIBILITY_TRANSFER_MISMATCH/,
);

console.log(
  "✓ Executable Tranche eligibility assessment recording smoke test passed",
);

console.log({
  assessment: {
    id: assessment.aggregate.id,

    transferId: assessment.aggregate.transferId,

    planId: assessment.aggregate.planId,

    trancheId: assessment.aggregate.trancheId,

    result: assessment.aggregate.result,

    version: assessment.aggregate.metadata.version,
  },

  event: {
    eventType: assessment.event.eventType,

    occurredAt: assessment.event.occurredAt.toISOString(),
  },

  invariants: {
    exactRecordedPlanRequired: true,

    exactPlannedTrancheRequired: true,

    eligibilityRecordedWithoutExecution: true,

    trancheStateNotAdvanced: true,

    treasuryExecutionNotCreated: true,
  },
});
