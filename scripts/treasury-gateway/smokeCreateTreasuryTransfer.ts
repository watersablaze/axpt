import assert from "node:assert/strict";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { createTreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/createTreasuryTransfer";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const requestedAt = new Date("2026-07-06T05:00:00.000Z");

const result = createTreasuryTransfer({
  transferId: "transfer-smoke-001",

  reference: "AXPT-TXFR-2026-001",

  command: {
    context: {
      commandId: "command-transfer-smoke-001",

      actorId: "actor-transfer-smoke-001",

      authorityGrantId: "authority-transfer-smoke-001",

      correlationId: "correlation-transfer-smoke-001",

      requestedAt,

      idempotencyKey: "create-transfer-smoke-001",
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

assert.equal(result.aggregate.id, "transfer-smoke-001");

assert.equal(result.aggregate.reference, "AXPT-TXFR-2026-001");

assert.equal(result.aggregate.status, TREASURY_TRANSFER_STATUS.CREATED);

assert.equal(result.aggregate.metadata.version, 1);

assert.equal(
  result.aggregate.metadata.createdAt.toISOString(),
  requestedAt.toISOString(),
);

assert.equal(
  result.aggregate.metadata.updatedAt.toISOString(),
  requestedAt.toISOString(),
);

assert.deepEqual(
  result.aggregate.requestedAmount,

  {
    amount: "1000000000.00",

    currency: "USD",
  },
);

assert.equal(result.aggregate.destinationCurrency, "EUR");

assert.deepEqual(
  result.aggregate.source,

  {
    kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

    programAccountId: "program-account-source-001",
  },
);

assert.deepEqual(
  result.aggregate.destination,

  {
    kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

    settlementEndpointId: "settlement-endpoint-destination-001",
  },
);

assert.equal(
  result.event.eventType,
  TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CREATED,
);

assert.equal(result.event.occurredAt.toISOString(), requestedAt.toISOString());

assert.equal(result.event.payload.transferId, "transfer-smoke-001");

assert.deepEqual(
  result.event.payload.requestedAmount,
  result.aggregate.requestedAmount,
);

console.log("✓ Treasury Transfer creation smoke test passed");

console.log({
  transfer: {
    id: result.aggregate.id,

    reference: result.aggregate.reference,

    status: result.aggregate.status,

    version: result.aggregate.metadata.version,

    source: result.aggregate.source,

    destination: result.aggregate.destination,

    requestedAmount: result.aggregate.requestedAmount,

    destinationCurrency: result.aggregate.destinationCurrency,
  },

  event: {
    eventType: result.event.eventType,

    occurredAt: result.event.occurredAt.toISOString(),
  },

  invariant: "Transfer intent created without execution",
});
