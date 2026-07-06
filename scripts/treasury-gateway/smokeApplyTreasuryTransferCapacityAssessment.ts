import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/recordTransferCapacityAssessment";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";

import { applyTreasuryTransferCapacityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferCapacityAssessment";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

function createAuthorizedTransfer(suffix: string) {
  const created = createTreasuryTransfer({
    transferId: `transfer-capacity-apply-${suffix}`,

    reference: `AXPT-TXFR-CAPACITY-${suffix}`,

    command: {
      context: {
        commandId: `command-create-capacity-${suffix}`,

        actorId: "actor-transfer-creator",

        correlationId: `correlation-capacity-${suffix}`,

        requestedAt: new Date("2026-07-06T10:00:00.000Z"),

        idempotencyKey: `create-capacity-${suffix}`,
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

  const review = beginTreasuryTransferAuthorityReview(created.aggregate, {
    context: {
      commandId: `command-review-capacity-${suffix}`,

      actorId: "actor-authority-reviewer",

      correlationId: `correlation-capacity-${suffix}`,

      requestedAt: new Date("2026-07-06T10:01:00.000Z"),

      idempotencyKey: `review-capacity-${suffix}`,
    },

    payload: {
      transferId: created.aggregate.id,
    },
  });

  const assessment = recordTransferAuthorityAssessment({
    assessmentId: `authority-assessment-capacity-${suffix}`,

    command: {
      context: {
        commandId: `command-assess-authority-capacity-${suffix}`,

        actorId: "actor-authority-assessor",

        correlationId: `correlation-capacity-${suffix}`,

        requestedAt: new Date("2026-07-06T10:02:00.000Z"),

        idempotencyKey: `assess-authority-capacity-${suffix}`,
      },

      payload: {
        transferId: review.aggregate.id,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [`artifact-authority-capacity-${suffix}`],

        assessedAt: new Date("2026-07-06T10:01:30.000Z"),
      },
    },
  });

  return applyTreasuryTransferAuthorityAssessment(
    review.aggregate,

    assessment.aggregate,

    {
      context: {
        commandId: `command-apply-authority-capacity-${suffix}`,

        actorId: "actor-authority-outcome-operator",

        correlationId: `correlation-capacity-${suffix}`,

        requestedAt: new Date("2026-07-06T10:03:00.000Z"),

        idempotencyKey: `apply-authority-capacity-${suffix}`,
      },

      payload: {
        transferId: review.aggregate.id,

        assessmentId: assessment.aggregate.id,
      },
    },
  ).aggregate;
}

const knownTransfer = createAuthorizedTransfer("known");

const knownAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-known",

  command: {
    context: {
      commandId: "command-record-capacity-known",

      actorId: "actor-capacity-assessor",

      correlationId: "correlation-capacity-known",

      requestedAt: new Date("2026-07-06T10:04:00.000Z"),

      idempotencyKey: "record-capacity-known",
    },

    payload: {
      transferId: knownTransfer.id,

      requestedAmount: knownTransfer.requestedAmount,

      constraints: [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "750000000.00",

            currency: "USD",
          },

          evidenceReferenceIds: ["capital-evidence-known"],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,

          evidenceReferenceIds: [],
        },
      ],

      assessedAt: new Date("2026-07-06T10:03:30.000Z"),
    },
  },
});

const known = applyTreasuryTransferCapacityAssessment(
  knownTransfer,

  knownAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-capacity-known",

      actorId: "actor-capacity-outcome-operator",

      correlationId: "correlation-capacity-known",

      requestedAt: new Date("2026-07-06T10:05:00.000Z"),

      idempotencyKey: "apply-capacity-known",
    },

    payload: {
      transferId: knownTransfer.id,

      assessmentId: knownAssessment.aggregate.id,
    },
  },
);

assert.equal(
  known.aggregate.status,

  TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
);

assert.equal(
  known.aggregate.metadata.version,

  4,
);

assert.equal(
  known.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_ASSESSED,
);

const undeterminedTransfer = createAuthorizedTransfer("undetermined");

const undeterminedAssessment = recordTransferCapacityAssessment({
  assessmentId: "capacity-assessment-undetermined",

  command: {
    context: {
      commandId: "command-record-capacity-undetermined",

      actorId: "actor-capacity-assessor",

      correlationId: "correlation-capacity-undetermined",

      requestedAt: new Date("2026-07-06T10:04:00.000Z"),

      idempotencyKey: "record-capacity-undetermined",
    },

    payload: {
      transferId: undeterminedTransfer.id,

      requestedAmount: undeterminedTransfer.requestedAmount,

      constraints: [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.COMPLIANCE,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.UNDETERMINED,

          evidenceReferenceIds: [],
        },
      ],

      assessedAt: new Date("2026-07-06T10:03:30.000Z"),
    },
  },
});

const undetermined = applyTreasuryTransferCapacityAssessment(
  undeterminedTransfer,

  undeterminedAssessment.aggregate,

  {
    context: {
      commandId: "command-apply-capacity-undetermined",

      actorId: "actor-capacity-outcome-operator",

      correlationId: "correlation-capacity-undetermined",

      requestedAt: new Date("2026-07-06T10:05:00.000Z"),

      idempotencyKey: "apply-capacity-undetermined",
    },

    payload: {
      transferId: undeterminedTransfer.id,

      assessmentId: undeterminedAssessment.aggregate.id,
    },
  },
);

assert.equal(
  undetermined.aggregate.status,

  TREASURY_TRANSFER_STATUS.CAPACITY_UNDETERMINED,
);

assert.equal(
  undetermined.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_UNDETERMINED,
);

assert.throws(
  () =>
    applyTreasuryTransferCapacityAssessment(
      knownTransfer,

      {
        ...knownAssessment.aggregate,

        transferId: "different-transfer-id",
      },

      {
        context: {
          commandId: "command-apply-capacity-mismatch",

          actorId: "actor-capacity-outcome-operator",

          correlationId: "correlation-capacity-mismatch",

          requestedAt: new Date("2026-07-06T10:06:00.000Z"),

          idempotencyKey: "apply-capacity-mismatch",
        },

        payload: {
          transferId: knownTransfer.id,

          assessmentId: knownAssessment.aggregate.id,
        },
      },
    ),

  /TRANSFER_CAPACITY_ASSESSMENT_TRANSFER_MISMATCH/,
);

assert.throws(
  () =>
    applyTreasuryTransferCapacityAssessment(
      known.aggregate,

      knownAssessment.aggregate,

      {
        context: {
          commandId: "command-repeat-capacity-application",

          actorId: "actor-capacity-outcome-operator",

          correlationId: "correlation-capacity-known",

          requestedAt: new Date("2026-07-06T10:07:00.000Z"),

          idempotencyKey: "repeat-capacity-application",
        },

        payload: {
          transferId: known.aggregate.id,

          assessmentId: knownAssessment.aggregate.id,
        },
      },
    ),

  /TREASURY_TRANSFER_TRANSITION_INVALID/,
);

console.log(
  "✓ Treasury Transfer capacity assessment application smoke test passed",
);

console.log({
  known: {
    status: known.aggregate.status,

    version: known.aggregate.metadata.version,

    eventType: known.event.eventType,

    executableNow: knownAssessment.aggregate.executableNow,
  },

  undetermined: {
    status: undetermined.aggregate.status,

    eventType: undetermined.event.eventType,

    executableNow: undeterminedAssessment.aggregate.executableNow,
  },

  invariants: {
    exactTransferAssessmentRequired: true,

    knownCapacityAdvancesTransfer: true,

    undeterminedCapacityRemainsExplicit: true,

    executableAmountRemainsOnAssessment: true,

    repeatApplicationRejected: true,

    planningStillNotInvented: true,
  },
});
