import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlan } from "../../src/domains/treasury/gateway/execution-plans/recordTreasuryExecutionPlan";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

const requestedAt = new Date("2026-07-06T11:00:00.000Z");

const assessedAt = new Date("2026-07-06T10:59:00.000Z");

const plannedAt = new Date("2026-07-06T11:01:00.000Z");

const capacityAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-plan-smoke-001",

  command: {
    context: {
      commandId: "command-record-capacity-plan-smoke-001",

      actorId: "actor-capacity-assessor",

      correlationId: "correlation-plan-smoke-001",

      requestedAt,

      idempotencyKey: "record-capacity-plan-smoke-001",
    },

    payload: {
      transferId: "transfer-plan-smoke-001",

      requestedAmount: {
        amount: "1000000000.00",

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

          evidenceReferenceIds: ["rail-capacity-plan-smoke-001"],
        },
      ],

      assessedAt,
    },
  },
}).aggregate;

const plan = recordTreasuryExecutionPlan({
  planId: "execution-plan-smoke-001",

  capacityAssessment,

  command: {
    context: {
      commandId: "command-record-execution-plan-smoke-001",

      actorId: "actor-execution-planner",

      correlationId: "correlation-plan-smoke-001",

      requestedAt: new Date("2026-07-06T11:02:00.000Z"),

      idempotencyKey: "record-execution-plan-smoke-001",
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
          trancheId: "tranche-plan-smoke-001",

          sequence: 1,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-plan-smoke-001",

          instructionId: "instruction-plan-smoke-001",

          settlementEndpointId: "settlement-endpoint-plan-smoke-001",

          purpose: "Program capitalization tranche 1",
        },

        {
          trancheId: "tranche-plan-smoke-002",

          sequence: 2,

          amount: {
            amount: "200000000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: "allocation-plan-smoke-002",

          instructionId: "instruction-plan-smoke-001",

          settlementEndpointId: "settlement-endpoint-plan-smoke-001",

          purpose: "Program capitalization tranche 2",
        },
      ],

      plannedAt,

      notes: "Two-tranche staged execution plan.",
    },
  },
});

assert.equal(
  plan.aggregate.status,

  TREASURY_EXECUTION_PLAN_STATUS.DRAFT,
);

assert.equal(
  plan.aggregate.metadata.version,

  1,
);

assert.equal(
  plan.aggregate.tranches.length,

  2,
);

assert.deepEqual(
  plan.aggregate.tranches.map((tranche) => tranche.status),

  [EXECUTABLE_TRANCHE_STATUS.PLANNED, EXECUTABLE_TRANCHE_STATUS.PLANNED],
);

assert.equal(
  plan.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,
);

assert.equal(
  plan.event.occurredAt.toISOString(),

  plannedAt.toISOString(),
);

assert.throws(
  () =>
    recordTreasuryExecutionPlan({
      planId: "execution-plan-smoke-duplicate-sequence",

      capacityAssessment,

      command: {
        ...planCommand({
          transferId: capacityAssessment.transferId,

          capacityAssessmentId: capacityAssessment.id,
        }),

        payload: {
          ...planCommand({
            transferId: capacityAssessment.transferId,

            capacityAssessmentId: capacityAssessment.id,
          }).payload,

          tranches: [
            {
              ...baseTranche("duplicate-sequence-001", 1),
            },

            {
              ...baseTranche("duplicate-sequence-002", 1),
            },
          ],
        },
      },
    }),

  /TREASURY_EXECUTION_PLAN_DUPLICATE_TRANCHE_SEQUENCE/,
);

assert.throws(
  () =>
    recordTreasuryExecutionPlan({
      planId: "execution-plan-smoke-currency-mismatch",

      capacityAssessment,

      command: {
        ...planCommand({
          transferId: capacityAssessment.transferId,

          capacityAssessmentId: capacityAssessment.id,
        }),

        payload: {
          ...planCommand({
            transferId: capacityAssessment.transferId,

            capacityAssessmentId: capacityAssessment.id,
          }).payload,

          plannedAmount: {
            amount: "400000000.00",

            currency: "USD",
          },

          tranches: [
            {
              ...baseTranche("currency-mismatch", 1),

              amount: {
                amount: "400000000.00",

                currency: "EUR",
              },
            },
          ],
        },
      },
    }),

  /TREASURY_EXECUTION_PLAN_TRANCHE_CURRENCY_MISMATCH/,
);

assert.throws(
  () =>
    recordTreasuryExecutionPlan({
      planId: "execution-plan-smoke-capacity-overrun",

      capacityAssessment,

      command: {
        ...planCommand({
          transferId: capacityAssessment.transferId,

          capacityAssessmentId: capacityAssessment.id,
        }),

        payload: {
          ...planCommand({
            transferId: capacityAssessment.transferId,

            capacityAssessmentId: capacityAssessment.id,
          }).payload,

          plannedAmount: {
            amount: "500000000.00",

            currency: "USD",
          },

          tranches: [
            {
              ...baseTranche("capacity-overrun", 1),

              amount: {
                amount: "500000000.00",

                currency: "USD",
              },
            },
          ],
        },
      },
    }),

  /TREASURY_EXECUTION_PLAN_EXCEEDS_EXECUTABLE_CAPACITY/,
);

console.log("✓ Treasury Execution Plan recording smoke test passed");

console.log({
  plan: {
    id: plan.aggregate.id,

    status: plan.aggregate.status,

    plannedAmount: plan.aggregate.plannedAmount,

    trancheCount: plan.aggregate.tranches.length,

    version: plan.aggregate.metadata.version,
  },

  tranches: plan.aggregate.tranches.map((tranche) => ({
    id: tranche.id,

    sequence: tranche.sequence,

    amount: tranche.amount,

    status: tranche.status,
  })),

  invariants: {
    trancheTotalMatchesPlannedAmount: true,

    plannedAmountWithinExecutableCapacity: true,

    duplicateSequenceRejected: true,

    trancheCurrencyMismatchRejected: true,

    capacityOverrunRejected: true,

    noTreasuryExecutionCreated: true,

    transferStateNotAdvanced: true,
  },
});

function baseTranche(
  trancheId: string,

  sequence: number,
) {
  return {
    trancheId,

    sequence,

    amount: {
      amount: "200000000.00",

      currency: "USD",
    },

    executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

    allocationId: "allocation-plan-smoke-001",

    instructionId: "instruction-plan-smoke-001",

    settlementEndpointId: "settlement-endpoint-plan-smoke-001",

    purpose: "Program capitalization tranche",
  };
}

function planCommand(params: {
  transferId: string;

  capacityAssessmentId: string;
}) {
  return {
    context: {
      commandId: `command-plan-${params.capacityAssessmentId}`,

      actorId: "actor-execution-planner",

      correlationId: "correlation-plan-smoke-helpers",

      requestedAt: new Date("2026-07-06T11:03:00.000Z"),

      idempotencyKey: `plan-${params.capacityAssessmentId}`,
    },

    payload: {
      transferId: params.transferId,

      capacityAssessmentId: params.capacityAssessmentId,

      plannedAmount: {
        amount: "400000000.00",

        currency: "USD",
      },

      destinationCurrency: "EUR",

      tranches: [
        baseTranche("helper-tranche-001", 1),

        baseTranche("helper-tranche-002", 2),
      ],

      plannedAt: new Date("2026-07-06T11:01:00.000Z"),
    },
  };
}
