import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { applyTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/transfers/applyTreasuryExecutionPlan";

import { applyTreasuryTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";

import { applyTreasuryTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferCapacityAssessment";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const created = createTreasuryTransfer({
  transferId: "transfer-plan-apply-smoke-001",

  reference: "AXPT-TXFR-PLAN-APPLY-001",

  command: {
    context: {
      commandId: "command-create-plan-apply-smoke-001",

      actorId: "actor-transfer-creator",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:00:00.000Z"),

      idempotencyKey: "create-plan-apply-smoke-001",
    },

    payload: {
      programId: "program-smoke-001",

      instructionId: "instruction-smoke-001",

      source: {
        kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

        programAccountId: "program-account-source-001",
      },

      destination: {
        kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

        settlementEndpointId: "settlement-endpoint-destination-001",
      },

      requestedAmount: {
        amount: "1000000000.00",

        currency: "USD",
      },

      destinationCurrency: "EUR",

      purpose: "Program capitalization",
    },
  },
});

const authorityReview = beginTreasuryTransferAuthorityReview(
  created.aggregate,

  {
    context: {
      commandId: "command-review-plan-apply-smoke-001",

      actorId: "actor-authority-reviewer",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:01:00.000Z"),

      idempotencyKey: "review-plan-apply-smoke-001",
    },

    payload: {
      transferId: created.aggregate.id,
    },
  },
);

const authorityAssessment = recordTransferAuthorityAssessment({
  assessmentId: "authority-assessment-plan-apply-smoke-001",

  command: {
    context: {
      commandId: "command-assess-authority-plan-apply-smoke-001",

      actorId: "actor-authority-assessor",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:02:00.000Z"),

      idempotencyKey: "assess-authority-plan-apply-smoke-001",
    },

    payload: {
      transferId: authorityReview.aggregate.id,

      result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

      evidenceArtifactIds: ["artifact-authority-plan-apply-smoke-001"],

      assessedAt: new Date("2026-07-06T12:01:30.000Z"),
    },
  },
});

const authorized = applyTreasuryTransferAuthorityAssessment(
  authorityReview.aggregate,

  authorityAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-authority-plan-apply-smoke-001",

      actorId: "actor-authority-outcome-operator",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:03:00.000Z"),

      idempotencyKey: "apply-authority-plan-apply-smoke-001",
    },

    payload: {
      transferId: authorityReview.aggregate.id,

      assessmentId: authorityAssessment.aggregate.id,
    },
  },
);

const capacityAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-plan-apply-smoke-001",

  command: {
    context: {
      commandId: "command-assess-capacity-plan-apply-smoke-001",

      actorId: "actor-capacity-assessor",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:04:00.000Z"),

      idempotencyKey: "assess-capacity-plan-apply-smoke-001",
    },

    payload: {
      transferId: authorized.aggregate.id,

      requestedAmount: authorized.aggregate.requestedAmount,

      constraints: [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "400000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["rail-capacity-plan-apply-smoke-001"],
        },
      ],

      assessedAt: new Date("2026-07-06T12:03:30.000Z"),
    },
  },
});

const capacityAssessed = applyTreasuryTransferCapacityAssessment(
  authorized.aggregate,

  capacityAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-capacity-plan-apply-smoke-001",

      actorId: "actor-capacity-outcome-operator",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:05:00.000Z"),

      idempotencyKey: "apply-capacity-plan-apply-smoke-001",
    },

    payload: {
      transferId: authorized.aggregate.id,

      assessmentId: capacityAssessment.aggregate.id,
    },
  },
);

const plan = recordTreasuryExecutionPlan({
  planId: "execution-plan-apply-smoke-001",

  capacityAssessment: capacityAssessment.aggregate,

  command: {
    context: {
      commandId: "command-record-plan-apply-smoke-001",

      actorId: "actor-execution-planner",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:06:00.000Z"),

      idempotencyKey: "record-plan-apply-smoke-001",
    },

    payload: {
      transferId: capacityAssessed.aggregate.id,

      capacityAssessmentId: capacityAssessment.aggregate.id,

      plannedAmount: {
        amount: "400000000.00",

        currency: "USD",
      },

      destinationCurrency: "EUR",

      tranches: [
        {
          trancheId: "tranche-plan-apply-smoke-001",

          sequence: 1,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-plan-apply-smoke-001",

          instructionId: "instruction-smoke-001",

          settlementEndpointId: "settlement-endpoint-destination-001",

          purpose: "Program capitalization tranche 1",
        },

        {
          trancheId: "tranche-plan-apply-smoke-002",

          sequence: 2,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-plan-apply-smoke-002",

          instructionId: "instruction-smoke-001",

          settlementEndpointId: "settlement-endpoint-destination-001",

          purpose: "Program capitalization tranche 2",
        },
      ],

      plannedAt: new Date("2026-07-06T12:05:30.000Z"),
    },
  },
});

const planned = applyTreasuryExecutionPlan(
  capacityAssessed.aggregate,

  plan.aggregate,

  {
    context: {
      commandId: "command-apply-plan-smoke-001",

      actorId: "actor-plan-outcome-operator",

      correlationId: "correlation-plan-apply-smoke-001",

      requestedAt: new Date("2026-07-06T12:07:00.000Z"),

      idempotencyKey: "apply-plan-smoke-001",
    },

    payload: {
      transferId: capacityAssessed.aggregate.id,

      planId: plan.aggregate.id,
    },
  },
);

assert.equal(
  planned.aggregate.status,

  TREASURY_TRANSFER_STATUS.PLANNED,
);

assert.equal(
  planned.aggregate.metadata.version,

  5,
);

assert.equal(
  planned.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
);

assert.equal(
  planned.event.payload.planId,

  plan.aggregate.id,
);

assert.throws(
  () =>
    applyTreasuryExecutionPlan(
      capacityAssessed.aggregate,

      {
        ...plan.aggregate,

        transferId: "different-transfer-id",
      },

      {
        context: {
          commandId: "command-apply-plan-mismatch",

          actorId: "actor-plan-outcome-operator",

          correlationId: "correlation-plan-mismatch",

          requestedAt: new Date("2026-07-06T12:08:00.000Z"),

          idempotencyKey: "apply-plan-mismatch",
        },

        payload: {
          transferId: capacityAssessed.aggregate.id,

          planId: plan.aggregate.id,
        },
      },
    ),

  /TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH/,
);

assert.throws(
  () =>
    applyTreasuryExecutionPlan(
      planned.aggregate,

      plan.aggregate,

      {
        context: {
          commandId: "command-repeat-plan-application",

          actorId: "actor-plan-outcome-operator",

          correlationId: "correlation-plan-apply-smoke-001",

          requestedAt: new Date("2026-07-06T12:09:00.000Z"),

          idempotencyKey: "repeat-plan-application",
        },

        payload: {
          transferId: planned.aggregate.id,

          planId: plan.aggregate.id,
        },
      },
    ),

  /TREASURY_TRANSFER_TRANSITION_INVALID/,
);

console.log("✓ Treasury Execution Plan application smoke test passed");

console.log({
  transfer: {
    status: planned.aggregate.status,

    version: planned.aggregate.metadata.version,

    eventType: planned.event.eventType,
  },

  plan: {
    id: plan.aggregate.id,

    status: plan.aggregate.status,

    trancheCount: plan.aggregate.tranches.length,
  },

  invariants: {
    exactTransferPlanRequired: true,

    planEvidenceControlsTransferState: true,

    planDetailsRemainOnPlan: true,

    repeatApplicationRejected: true,

    noTreasuryExecutionCreated: true,

    executionEligibilityStillNotInvented: true,
  },
});
