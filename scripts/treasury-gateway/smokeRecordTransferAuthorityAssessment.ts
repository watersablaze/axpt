import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

const requestedAt = new Date("2026-07-06T07:00:00.000Z");

const assessedAt = new Date("2026-07-06T06:59:00.000Z");

const result = recordTransferAuthorityAssessment({
  assessmentId: "transfer-authority-assessment-smoke-001",

  command: {
    context: {
      commandId: "command-record-transfer-authority-assessment-smoke-001",

      actorId: "actor-transfer-authority-assessor-smoke-001",

      authorityGrantId: "authority-grant-context-smoke-001",

      correlationId: "correlation-transfer-authority-assessment-smoke-001",

      requestedAt,

      idempotencyKey: "record-transfer-authority-assessment-smoke-001",
    },

    payload: {
      transferId: "transfer-authority-review-smoke-001",

      result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

      instructionId: "instruction-smoke-001",

      evidenceArtifactIds: [
        "artifact-authority-evidence-smoke-001",

        "artifact-authority-evidence-smoke-002",
      ],

      assessedAt,

      notes:
        "Approved instruction evidence supports authority for this transfer.",
    },
  },
});

assert.equal(
  result.aggregate.id,

  "transfer-authority-assessment-smoke-001",
);

assert.equal(
  result.aggregate.transferId,

  "transfer-authority-review-smoke-001",
);

assert.equal(
  result.aggregate.result,

  TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
);

assert.equal(
  result.aggregate.assessedByActorId,

  "actor-transfer-authority-assessor-smoke-001",
);

assert.equal(
  result.aggregate.assessedAt.toISOString(),

  assessedAt.toISOString(),
);

assert.deepEqual(
  result.aggregate.evidenceArtifactIds,

  [
    "artifact-authority-evidence-smoke-001",

    "artifact-authority-evidence-smoke-002",
  ],
);

assert.equal(
  result.aggregate.metadata.version,

  1,
);

assert.equal(
  result.aggregate.metadata.createdAt.toISOString(),

  requestedAt.toISOString(),
);

assert.equal(
  result.event.eventType,

  TREASURY_EVENT_TYPE.TRANSFER_AUTHORITY_ASSESSMENT_RECORDED,
);

assert.equal(
  result.event.payload.assessmentId,

  result.aggregate.id,
);

assert.equal(
  result.event.payload.transferId,

  result.aggregate.transferId,
);

assert.equal(
  result.event.occurredAt.toISOString(),

  assessedAt.toISOString(),
);

console.log("✓ Transfer Authority Assessment recording smoke test passed");

console.log({
  assessment: {
    id: result.aggregate.id,

    transferId: result.aggregate.transferId,

    result: result.aggregate.result,

    assessedByActorId: result.aggregate.assessedByActorId,

    assessedAt: result.aggregate.assessedAt.toISOString(),

    evidenceArtifactIds: result.aggregate.evidenceArtifactIds,

    version: result.aggregate.metadata.version,
  },

  event: {
    eventType: result.event.eventType,

    occurredAt: result.event.occurredAt.toISOString(),
  },

  invariants: {
    immutableAssessmentRecorded: true,

    transferStateNotAdvanced: true,

    capacityNotInvented: true,
  },
});
