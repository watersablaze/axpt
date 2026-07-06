import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfers/applyTreasuryTransferAuthorityAssessment";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

function createTransferUnderAuthorityReview(suffix: string) {
  const created = createTreasuryTransfer({
    transferId: `transfer-${suffix}`,

    reference: `AXPT-TXFR-${suffix}`,

    command: {
      context: {
        commandId: `command-create-${suffix}`,

        actorId: "actor-transfer-creator",

        correlationId: `correlation-${suffix}`,

        requestedAt: new Date("2026-07-06T08:00:00.000Z"),

        idempotencyKey: `create-${suffix}`,
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

  return beginTreasuryTransferAuthorityReview(created.aggregate, {
    context: {
      commandId: `command-review-${suffix}`,

      actorId: "actor-authority-reviewer",

      correlationId: `correlation-${suffix}`,

      requestedAt: new Date("2026-07-06T08:01:00.000Z"),

      idempotencyKey: `review-${suffix}`,
    },

    payload: {
      transferId: created.aggregate.id,
    },
  }).aggregate;
}

function recordAssessment(params: {
  suffix: string;

  transferId: string;

  result: (typeof TRANSFER_AUTHORITY_ASSESSMENT_RESULT)[keyof typeof TRANSFER_AUTHORITY_ASSESSMENT_RESULT];
}) {
  return recordTransferAuthorityAssessment({
    assessmentId: `assessment-${params.suffix}`,

    command: {
      context: {
        commandId: `command-assess-${params.suffix}`,

        actorId: "actor-authority-assessor",

        correlationId: `correlation-${params.suffix}`,

        requestedAt: new Date("2026-07-06T08:02:00.000Z"),

        idempotencyKey: `assess-${params.suffix}`,
      },

      payload: {
        transferId: params.transferId,

        result: params.result,

        evidenceArtifactIds: [`artifact-authority-${params.suffix}`],

        assessedAt: new Date("2026-07-06T08:01:30.000Z"),
      },
    },
  }).aggregate;
}

function applyAssessment(params: {
  suffix: string;

  transfer: ReturnType<typeof createTransferUnderAuthorityReview>;

  assessment: ReturnType<typeof recordAssessment>;
}) {
  return applyTreasuryTransferAuthorityAssessment(
    params.transfer,

    params.assessment,

    {
      context: {
        commandId: `command-apply-${params.suffix}`,

        actorId: "actor-authority-outcome-operator",

        correlationId: `correlation-${params.suffix}`,

        requestedAt: new Date("2026-07-06T08:03:00.000Z"),

        idempotencyKey: `apply-${params.suffix}`,
      },

      payload: {
        transferId: params.transfer.id,

        assessmentId: params.assessment.id,
      },
    },
  );
}

const authorizedTransfer = createTransferUnderAuthorityReview("authorized");

const authorizedAssessment = recordAssessment({
  suffix: "authorized",

  transferId: authorizedTransfer.id,

  result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
});

const authorized = applyAssessment({
  suffix: "authorized",

  transfer: authorizedTransfer,

  assessment: authorizedAssessment,
});

assert.equal(
  authorized.aggregate.status,

  TREASURY_TRANSFER_STATUS.AUTHORIZED,
);

assert.equal(
  authorized.aggregate.metadata.version,

  3,
);

assert.equal(
  authorized.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORIZED,
);

const clarificationTransfer =
  createTransferUnderAuthorityReview("clarification");

const clarificationAssessment = recordAssessment({
  suffix: "clarification",

  transferId: clarificationTransfer.id,

  result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.REQUIRES_CLARIFICATION,
});

const clarification = applyAssessment({
  suffix: "clarification",

  transfer: clarificationTransfer,

  assessment: clarificationAssessment,
});

assert.equal(
  clarification.aggregate.status,

  TREASURY_TRANSFER_STATUS.REQUIRES_CLARIFICATION,
);

assert.equal(
  clarification.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_CLARIFICATION_REQUIRED,
);

const rejectedTransfer = createTransferUnderAuthorityReview("rejected");

const rejectedAssessment = recordAssessment({
  suffix: "rejected",

  transferId: rejectedTransfer.id,

  result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.NOT_AUTHORIZED,
});

const rejected = applyAssessment({
  suffix: "rejected",

  transfer: rejectedTransfer,

  assessment: rejectedAssessment,
});

assert.equal(
  rejected.aggregate.status,

  TREASURY_TRANSFER_STATUS.REJECTED,
);

assert.equal(
  rejected.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_REJECTED,
);

assert.throws(
  () =>
    applyTreasuryTransferAuthorityAssessment(
      authorizedTransfer,

      {
        ...authorizedAssessment,

        transferId: "different-transfer-id",
      },

      {
        context: {
          commandId: "command-apply-mismatch",

          actorId: "actor-authority-outcome-operator",

          correlationId: "correlation-mismatch",

          requestedAt: new Date("2026-07-06T08:04:00.000Z"),

          idempotencyKey: "apply-mismatch",
        },

        payload: {
          transferId: authorizedTransfer.id,

          assessmentId: authorizedAssessment.id,
        },
      },
    ),

  /TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_MISMATCH/,
);

assert.throws(
  () =>
    applyAssessment({
      suffix: "repeat",

      transfer: authorized.aggregate,

      assessment: authorizedAssessment,
    }),

  /TREASURY_TRANSFER_TRANSITION_INVALID/,
);

console.log(
  "✓ Treasury Transfer authority assessment application smoke test passed",
);

console.log({
  authorized: {
    status: authorized.aggregate.status,

    version: authorized.aggregate.metadata.version,

    eventType: authorized.event.eventType,
  },

  clarification: {
    status: clarification.aggregate.status,

    eventType: clarification.event.eventType,
  },

  rejected: {
    status: rejected.aggregate.status,

    eventType: rejected.event.eventType,
  },

  invariants: {
    exactTransferAssessmentRequired: true,

    repeatApplicationRejected: true,

    assessmentEvidenceControlsOutcome: true,

    capacityStillNotInvented: true,
  },
});
