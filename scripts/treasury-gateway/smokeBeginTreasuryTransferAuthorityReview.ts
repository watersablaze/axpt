import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { beginTreasuryTransferAuthorityReview } from "../../src/domains/treasury/gateway/transfers/beginTreasuryTransferAuthorityReview";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const createdAt = new Date("2026-07-06T06:00:00.000Z");

const reviewStartedAt = new Date("2026-07-06T06:01:00.000Z");

const created = createTreasuryTransfer({
  transferId: "transfer-authority-review-smoke-001",

  reference: "AXPT-TXFR-2026-002",

  command: {
    context: {
      commandId: "command-create-transfer-authority-review-smoke-001",

      actorId: "actor-transfer-authority-review-smoke-001",

      authorityGrantId: "authority-transfer-authority-review-smoke-001",

      correlationId: "correlation-transfer-authority-review-smoke-001",

      requestedAt: createdAt,

      idempotencyKey: "create-transfer-authority-review-smoke-001",
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

const reviewed = beginTreasuryTransferAuthorityReview(
  created.aggregate,

  {
    context: {
      commandId: "command-begin-transfer-authority-review-smoke-001",

      actorId: "actor-transfer-authority-review-smoke-002",

      authorityGrantId: "authority-transfer-authority-review-smoke-001",

      correlationId: "correlation-transfer-authority-review-smoke-001",

      causationId: "command-create-transfer-authority-review-smoke-001",

      requestedAt: reviewStartedAt,

      idempotencyKey: "begin-transfer-authority-review-smoke-001",
    },

    payload: {
      transferId: created.aggregate.id,
    },
  },
);

assert.equal(
  created.aggregate.status,

  TREASURY_TRANSFER_STATUS.CREATED,
);

assert.equal(
  created.aggregate.metadata.version,

  1,
);

assert.equal(
  reviewed.aggregate.status,

  TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW,
);

assert.equal(
  reviewed.aggregate.metadata.version,

  2,
);

assert.equal(
  reviewed.aggregate.metadata.updatedAt.toISOString(),

  reviewStartedAt.toISOString(),
);

assert.equal(
  reviewed.aggregate.metadata.lastModifiedByActorId,

  "actor-transfer-authority-review-smoke-002",
);

assert.equal(
  reviewed.event.eventType,

  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_REVIEW_STARTED,
);

assert.equal(
  reviewed.event.payload.transferId,

  created.aggregate.id,
);

assert.equal(
  reviewed.event.occurredAt.toISOString(),

  reviewStartedAt.toISOString(),
);

assert.throws(
  () =>
    beginTreasuryTransferAuthorityReview(
      reviewed.aggregate,

      {
        context: {
          commandId: "command-repeat-transfer-authority-review-smoke-001",

          actorId: "actor-transfer-authority-review-smoke-003",

          correlationId: "correlation-transfer-authority-review-smoke-001",

          requestedAt: new Date("2026-07-06T06:02:00.000Z"),

          idempotencyKey: "repeat-transfer-authority-review-smoke-001",
        },

        payload: {
          transferId: reviewed.aggregate.id,
        },
      },
    ),

  /TREASURY_TRANSFER_TRANSITION_INVALID/,
);

assert.throws(
  () =>
    beginTreasuryTransferAuthorityReview(
      created.aggregate,

      {
        context: {
          commandId: "command-target-mismatch-smoke-001",

          actorId: "actor-transfer-authority-review-smoke-004",

          correlationId: "correlation-transfer-authority-review-smoke-001",

          requestedAt: new Date("2026-07-06T06:03:00.000Z"),

          idempotencyKey: "target-mismatch-smoke-001",
        },

        payload: {
          transferId: "different-transfer-id",
        },
      },
    ),

  /TREASURY_TRANSFER_COMMAND_TARGET_MISMATCH/,
);

console.log("✓ Treasury Transfer authority review smoke test passed");

console.log({
  created: {
    status: created.aggregate.status,

    version: created.aggregate.metadata.version,
  },

  authorityReview: {
    status: reviewed.aggregate.status,

    version: reviewed.aggregate.metadata.version,

    eventType: reviewed.event.eventType,
  },

  invariants: {
    repeatedReviewRejected: true,

    commandTargetMismatchRejected: true,

    authorityOutcomeNotYetInvented: true,
  },
});
