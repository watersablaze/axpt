import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import type { Principal } from "../../src/domains/auth/types";

import { originateTreasuryTransferHttp } from "../../src/domains/control-center/treasury/originateTreasuryTransferHttp";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function buildRequest(params: {
  idempotencyKey?: string;

  body?: unknown;
}): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (params.idempotencyKey) {
    headers.set("Idempotency-Key", params.idempotencyKey);
  }

  return new Request(
    "http://localhost/api/admin/control-center/treasury/transfers",
    {
      method: "POST",

      headers,

      body: JSON.stringify(params.body ?? {}),
    },
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const idempotencyKey = `smoke-control-center-originate-${fixtureId}`;

  const principal: Principal = {
    userId: `smoke-control-center-operator-${fixtureId}`,

    email: `operator-${fixtureId}@example.test`,

    displayName: "Treasury Smoke Operator",

    roles: ["TREASURY_OPERATOR"],

    permissions: ["TREASURY_READ", "TREASURY_ORIGINATE"],
  };

  const body = {
    reference: `AXPT-CONTROL-CENTER-${fixtureId}`,

    programId: `control-center-program-${fixtureId}`,

    source: {
      kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

      programAccountId: `control-center-program-account-${fixtureId}`,
    },

    destination: {
      kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

      settlementEndpointId: `control-center-settlement-endpoint-${fixtureId}`,
    },

    requestedAmount: {
      amount: "375000.00",

      currency: "USD",
    },

    destinationCurrency: "USD",

    purpose: "Control Center Treasury Transfer origination smoke",
  };

  const generatedIdentities = [
    fixtureId,
    `command-${fixtureId}`,
    `event-${fixtureId}`,
    `correlation-${fixtureId}`,
  ];

  let identityIndex = 0;

  const generateIdentity = () => {
    const identity = generatedIdentities[identityIndex];

    identityIndex += 1;

    if (!identity) {
      return randomUUID();
    }

    return identity;
  };

  const fixedNow = new Date("2026-08-19T01:30:00.000Z");

  try {
    const missingKey = await originateTreasuryTransferHttp({
      request: buildRequest({
        body,
      }),

      principal,

      prisma,
    });

    assert.equal(missingKey.status, 400);

    assert.deepEqual(missingKey.body, {
      ok: false,

      error: "IDEMPOTENCY_KEY_REQUIRED",
    });

    const invalidBody = await originateTreasuryTransferHttp({
      request: buildRequest({
        idempotencyKey: `invalid-${fixtureId}`,

        body: {
          reference: "",
        },
      }),

      principal,

      prisma,
    });

    assert.equal(invalidBody.status, 400);

    assert.equal(invalidBody.body.ok, false);

    const first = await originateTreasuryTransferHttp({
      request: buildRequest({
        idempotencyKey,

        body,
      }),

      principal,

      prisma,

      generateIdentity,

      now: () => fixedNow,
    });

    assert.equal(first.status, 201);

    assert.equal(first.body.ok, true);

    if (!first.body.ok) {
      throw new Error("[CONTROL_CENTER_TREASURY_ORIGINATION_EXPECTED_SUCCESS]");
    }

    assert.equal(first.body.disposition, "CREATED");

    assert.equal(first.body.transfer.id, `treasury-transfer-${fixtureId}`);

    assert.equal(first.body.transfer.status, "CREATED");

    assert.equal(first.body.transfer.version, 1);

    assert.equal(first.body.transfer.createdAt, fixedNow.toISOString());

    const retry = await originateTreasuryTransferHttp({
      request: buildRequest({
        idempotencyKey,

        body,
      }),

      principal,

      prisma,
    });

    assert.equal(retry.status, 200);

    assert.equal(retry.body.ok, true);

    if (!retry.body.ok) {
      throw new Error(
        "[CONTROL_CENTER_TREASURY_ORIGINATION_RETRY_EXPECTED_SUCCESS]",
      );
    }

    assert.equal(retry.body.disposition, "REPLAYED");

    assert.equal(retry.body.transfer.id, first.body.transfer.id);

    const collision = await originateTreasuryTransferHttp({
      request: buildRequest({
        idempotencyKey,

        body: {
          ...body,

          purpose: "Different purpose under same request identity",
        },
      }),

      principal,

      prisma,
    });

    assert.equal(collision.status, 409);

    assert.deepEqual(collision.body, {
      ok: false,

      error: "TREASURY_TRANSFER_IDEMPOTENCY_COLLISION",
    });

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: first.body.transfer.id,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: first.body.transfer.id,
      },
    });

    const receipt = await prisma.treasuryGatewayCommandReceipt.findUnique({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    assert(receipt);

    assert.equal(receipt.actorId, principal.userId);

    assert.equal(receipt.aggregateId, first.body.transfer.id);

    console.log(
      "✓ Control Center Treasury Transfer HTTP origination smoke test passed",
    );

    console.log({
      cases: {
        missingIdempotencyKey: {
          status: missingKey.status,
        },

        invalidRequest: {
          status: invalidBody.status,
        },

        firstOrigination: {
          status: first.status,

          disposition: first.body.disposition,

          transferId: first.body.transfer.id,
        },

        exactRetry: {
          status: retry.status,

          disposition: retry.body.disposition,

          transferId: retry.body.transfer.id,
        },

        changedRetry: {
          status: collision.status,
        },
      },

      durableState: {
        aggregates: aggregateCount,

        events: eventCount,

        receipts: receipt ? 1 : 0,
      },

      invariants: {
        idempotencyKeyRequired: true,

        invalidRequestRejected: true,

        authenticatedPrincipalBecomesActor: true,

        firstRequestReturns201: true,

        firstRequestCreatesCanonicalTransfer: true,

        exactRetryReturns200: true,

        exactRetryReturnsOriginalTransfer: true,

        changedRetryReturns409: true,

        retryCreatesNoDuplicateAggregate: true,

        retryAppendsNoDuplicateEvent: true,

        durableCommandReceiptRetained: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        idempotencyKey,
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          startsWith: "treasury-transfer-",
        },

        actorId: principal.userId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          startsWith: `treasury-transfer-${fixtureId}`,
        },
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
