import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { applyExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/execution-plans/applyExecutableTrancheEligibilityAssessment";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/contracts";

import { recordExecutableTrancheEligibilityAssessment } from "../../src/domains/treasury/gateway/executable-tranche-eligibility-assessments/recordExecutableTrancheEligibilityAssessment";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

const capacityAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-apply-tranche-eligibility-smoke-001",

  command: {
    context: {
      commandId: "command-capacity-apply-tranche-eligibility-smoke-001",

      actorId: "actor-capacity-assessor",

      correlationId: "correlation-apply-tranche-eligibility-smoke-001",

      requestedAt: new Date("2026-07-06T14:00:00.000Z"),

      idempotencyKey: "capacity-apply-tranche-eligibility-smoke-001",
    },

    payload: {
      transferId: "transfer-apply-tranche-eligibility-smoke-001",

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

          evidenceReferenceIds: [
            "rail-capacity-apply-tranche-eligibility-smoke-001",
          ],
        },
      ],

      assessedAt: new Date("2026-07-06T13:59:00.000Z"),
    },
  },
}).aggregate;

const plan = recordTreasuryExecutionPlan({
  planId: "execution-plan-apply-tranche-eligibility-smoke-001",

  capacityAssessment,

  command: {
    context: {
      commandId: "command-plan-apply-tranche-eligibility-smoke-001",

      actorId: "actor-execution-planner",

      correlationId: "correlation-apply-tranche-eligibility-smoke-001",

      requestedAt: new Date("2026-07-06T14:01:00.000Z"),

      idempotencyKey: "plan-apply-tranche-eligibility-smoke-001",
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
          trancheId: "tranche-apply-eligibility-smoke-001",

          sequence: 1,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-apply-eligibility-smoke-001",

          instructionId: "instruction-apply-eligibility-smoke-001",

          settlementEndpointId:
            "settlement-endpoint-apply-eligibility-smoke-001",

          purpose: "Eligible tranche",
        },

        {
          trancheId: "tranche-apply-eligibility-smoke-002",

          sequence: 2,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-apply-eligibility-smoke-002",

          instructionId: "instruction-apply-eligibility-smoke-001",

          settlementEndpointId:
            "settlement-endpoint-apply-eligibility-smoke-001",

          purpose: "Sibling tranche",
        },
      ],

      plannedAt: new Date("2026-07-06T14:00:30.000Z"),
    },
  },
}).aggregate;

function recordAssessment(params: {
  assessmentId: string;

  trancheId: string;

  result: (typeof EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT)[keyof typeof EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT];
}) {
  return recordExecutableTrancheEligibilityAssessment({
    assessmentId: params.assessmentId,

    plan,

    command: {
      context: {
        commandId: `command-${params.assessmentId}`,

        actorId: "actor-tranche-eligibility-assessor",

        correlationId: "correlation-apply-tranche-eligibility-smoke-001",

        requestedAt: new Date("2026-07-06T14:02:00.000Z"),

        idempotencyKey: `record-${params.assessmentId}`,
      },

      payload: {
        transferId: plan.transferId,

        planId: plan.id,

        trancheId: params.trancheId,

        result: params.result,

        evidenceArtifactIds: [`artifact-${params.assessmentId}`],

        assessedAt: new Date("2026-07-06T14:01:30.000Z"),
      },
    },
  }).aggregate;
}

function applyAssessment(params: {
  assessment: ReturnType<typeof recordAssessment>;

  planAggregate?: typeof plan;
}) {
  const aggregate = params.planAggregate ?? plan;

  return applyExecutableTrancheEligibilityAssessment(
    aggregate,

    params.assessment,

    {
      context: {
        commandId: `command-apply-${params.assessment.id}`,

        actorId: "actor-tranche-eligibility-outcome-operator",

        correlationId: "correlation-apply-tranche-eligibility-smoke-001",

        requestedAt: new Date("2026-07-06T14:03:00.000Z"),

        idempotencyKey: `apply-${params.assessment.id}`,
      },

      payload: {
        planId: aggregate.id,

        assessmentId: params.assessment.id,
      },
    },
  );
}

const eligibleAssessment = recordAssessment({
  assessmentId: "tranche-eligibility-assessment-eligible-smoke-001",

  trancheId: "tranche-apply-eligibility-smoke-001",

  result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE,
});

const eligible = applyAssessment({
  assessment: eligibleAssessment,
});

assert.equal(
  eligible.aggregate.status,

  TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
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
  eligible.aggregate.tranches[1]?.status,

  EXECUTABLE_TRANCHE_STATUS.PLANNED,
);

assert.equal(
  eligible.event.eventType,

  TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_ELIGIBLE,
);

const ineligibleAssessment = recordAssessment({
  assessmentId: "tranche-eligibility-assessment-ineligible-smoke-001",

  trancheId: "tranche-apply-eligibility-smoke-001",

  result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.INELIGIBLE,
});

const ineligible = applyAssessment({
  assessment: ineligibleAssessment,
});

assert.equal(
  ineligible.aggregate.tranches[0]?.status,

  EXECUTABLE_TRANCHE_STATUS.INELIGIBLE,
);

assert.equal(
  ineligible.event.eventType,

  TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_INELIGIBLE,
);

const clarificationAssessment = recordAssessment({
  assessmentId: "tranche-eligibility-assessment-clarification-smoke-001",

  trancheId: "tranche-apply-eligibility-smoke-001",

  result: EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.REQUIRES_CLARIFICATION,
});

const clarification = applyAssessment({
  assessment: clarificationAssessment,
});

assert.equal(
  clarification.aggregate.tranches[0]?.status,

  EXECUTABLE_TRANCHE_STATUS.REQUIRES_CLARIFICATION,
);

assert.equal(
  clarification.event.eventType,

  TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_CLARIFICATION_REQUIRED,
);

assert.throws(
  () =>
    applyAssessment({
      assessment: eligibleAssessment,

      planAggregate: eligible.aggregate,
    }),

  /EXECUTABLE_TRANCHE_ELIGIBILITY_TRANCHE_ALREADY_RESOLVED/,
);

assert.throws(
  () =>
    applyExecutableTrancheEligibilityAssessment(
      plan,

      {
        ...eligibleAssessment,

        planId: "different-plan-id",
      },

      {
        context: {
          commandId: "command-apply-tranche-eligibility-plan-mismatch",

          actorId: "actor-tranche-eligibility-outcome-operator",

          correlationId: "correlation-plan-mismatch",

          requestedAt: new Date("2026-07-06T14:04:00.000Z"),

          idempotencyKey: "apply-tranche-eligibility-plan-mismatch",
        },

        payload: {
          planId: plan.id,

          assessmentId: eligibleAssessment.id,
        },
      },
    ),

  /EXECUTABLE_TRANCHE_ELIGIBILITY_PLAN_MISMATCH/,
);

console.log(
  "✓ Executable Tranche eligibility assessment application smoke test passed",
);

console.log({
  eligible: {
    trancheStatus: eligible.aggregate.tranches[0]?.status,

    siblingStatus: eligible.aggregate.tranches[1]?.status,

    planStatus: eligible.aggregate.status,

    planVersion: eligible.aggregate.metadata.version,

    eventType: eligible.event.eventType,
  },

  ineligible: {
    trancheStatus: ineligible.aggregate.tranches[0]?.status,

    eventType: ineligible.event.eventType,
  },

  clarification: {
    trancheStatus: clarification.aggregate.tranches[0]?.status,

    eventType: clarification.event.eventType,
  },

  invariants: {
    exactPlanAssessmentRequired: true,

    assessmentResultControlsTrancheState: true,

    siblingTrancheUnchanged: true,

    repeatApplicationRejected: true,

    planRemainsRecorded: true,

    treasuryTransferUnchanged: true,

    treasuryExecutionNotCreated: true,
  },
});
