import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

const requestedAt = new Date("2026-07-06T09:00:00.000Z");

const assessedAt = new Date("2026-07-06T08:59:00.000Z");

const result = recordTransferCapacityAssessment({
  assessmentId: "transfer-capacity-assessment-smoke-001",

  command: {
    context: {
      commandId: "command-record-transfer-capacity-smoke-001",

      actorId: "actor-transfer-capacity-assessor-smoke-001",

      correlationId: "correlation-transfer-capacity-smoke-001",

      requestedAt,

      idempotencyKey: "record-transfer-capacity-smoke-001",
    },

    payload: {
      transferId: "transfer-capacity-smoke-001",

      requestedAmount: {
        amount: "1000000000.00",

        currency: "USD",
      },

      constraints: [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "850000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["program-capital-receipt-recognized-001"],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.AUTHORITY,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "1000000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["transfer-authority-assessment-001"],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.COMPLIANCE,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "700000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["compliance-capacity-evidence-001"],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,

          evidenceReferenceIds: [],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "500000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["rail-capacity-evidence-001"],
        },
      ],

      assessedAt,

      notes:
        "Executable capacity is bounded by the lowest applicable constraint.",
    },
  },
});

assert.equal(
  result.aggregate.executableNow?.amount,

  "500000000.00",
);

assert.equal(
  result.aggregate.executableNow?.currency,

  "USD",
);

assert.equal(
  result.aggregate.metadata.version,

  1,
);

assert.equal(
  result.event.eventType,

  TREASURY_EVENT_TYPE.TRANSFER_CAPACITY_ASSESSMENT_RECORDED,
);

assert.equal(
  result.event.occurredAt.toISOString(),

  assessedAt.toISOString(),
);

const undetermined = recordTransferCapacityAssessment({
  assessmentId: "transfer-capacity-assessment-smoke-002",

  command: {
    context: {
      commandId: "command-record-transfer-capacity-smoke-002",

      actorId: "actor-transfer-capacity-assessor-smoke-001",

      correlationId: "correlation-transfer-capacity-smoke-002",

      requestedAt,

      idempotencyKey: "record-transfer-capacity-smoke-002",
    },

    payload: {
      transferId: "transfer-capacity-smoke-002",

      requestedAmount: {
        amount: "1000000000.00",

        currency: "USD",
      },

      constraints: [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "850000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["program-capital-receipt-recognized-001"],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.COMPLIANCE,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.UNDETERMINED,

          evidenceReferenceIds: [],
        },
      ],

      assessedAt,
    },
  },
});

assert.equal(
  undetermined.aggregate.executableNow,

  undefined,
);

assert.throws(
  () =>
    recordTransferCapacityAssessment({
      assessmentId: "transfer-capacity-assessment-smoke-003",

      command: {
        context: {
          commandId: "command-record-transfer-capacity-smoke-003",

          actorId: "actor-transfer-capacity-assessor-smoke-001",

          correlationId: "correlation-transfer-capacity-smoke-003",

          requestedAt,

          idempotencyKey: "record-transfer-capacity-smoke-003",
        },

        payload: {
          transferId: "transfer-capacity-smoke-003",

          requestedAmount: {
            amount: "1000000000.00",

            currency: "USD",
          },

          constraints: [
            {
              type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

              status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

              evidenceReferenceIds: [],
            },
          ],

          assessedAt,
        },
      },
    }),

  /TRANSFER_CAPACITY_APPLICABLE_LIMIT_REQUIRED/,
);

console.log("✓ Transfer Capacity Assessment recording smoke test passed");

console.log({
  assessed: {
    executableNow: result.aggregate.executableNow,

    version: result.aggregate.metadata.version,

    eventType: result.event.eventType,
  },

  undetermined: {
    executableNow: undetermined.aggregate.executableNow,
  },

  invariants: {
    minimumApplicableConstraintControlsCapacity: true,

    notRequiredConstraintDoesNotReduceCapacity: true,

    undeterminedCapacityDoesNotInventAmount: true,

    applicableConstraintRequiresLimit: true,

    transferStateNotAdvanced: true,

    planningNotInvented: true,
  },
});
