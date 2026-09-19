import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  getAddress,
} from "viem";

import {
  registerSettlementSourceIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/settlement-sources/application/registerSettlementSourceIdempotentlyWithClient";

import {
  SETTLEMENT_SOURCE_KIND,
} from "../../src/domains/treasury/gateway/settlement-sources/contracts";

import {
  loadSettlementSourceWithClient,
} from "../../src/domains/treasury/gateway/settlement-sources/persistence/loadSettlementSourceWithClient";

import {
  SETTLEMENT_SOURCE_STATUS,
} from "../../src/domains/treasury/gateway/settlement-sources/status";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

const prisma = new PrismaClient();

const runId = randomUUID();

const settlementSourceId =
  `settlement-source-er2h-${runId}`;

const idempotencyKey =
  `settlement-source-er2h-idempotency-${runId}`;

const eventId =
  `settlement-source-er2h-event-${runId}`;

const treasuryAddress =
  "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F";

const changedAddress =
  "0x40143ECEF96EC52365c6E3164dE891C62c9A012E";

const context = {
  commandId:
    `settlement-source-er2h-command-${runId}`,

  actorId:
    `settlement-source-er2h-actor-${runId}`,

  correlationId:
    `settlement-source-er2h-correlation-${runId}`,

  requestedAt: new Date(),

  idempotencyKey,
};

const request = {
  settlementSourceId,

  reference:
    `Ethereum Mainnet Treasury Source ${runId}`,

  eventId,

  context,

  payload: {
    coordinates: {
      kind:
        SETTLEMENT_SOURCE_KIND.EVM_ACCOUNT,

      chainId: 1,

      network:
        "ethereum-mainnet",

      address:
        treasuryAddress,
    },
  },
} as const;

async function cleanup() {
  await prisma.$transaction(
    async (tx: TransactionClient) => {
      await tx.treasuryGatewayCommandReceipt.deleteMany({
        where: {
          idempotencyKey,
        },
      });

      await tx.treasuryGatewayEvent.deleteMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.SETTLEMENT_SOURCE,

          aggregateId:
            settlementSourceId,
        },
      });

      await tx.treasuryGatewayAggregate.deleteMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.SETTLEMENT_SOURCE,

          aggregateId:
            settlementSourceId,
        },
      });
    },
  );
}

async function main() {
  await cleanup();

  try {
    const first =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          registerSettlementSourceIdempotentlyWithClient({
            request,

            client: tx,
          }),
      );

    assert.equal(
      first.disposition,
      "REGISTERED",
    );

    assert.equal(
      first.aggregate.id,
      settlementSourceId,
    );

    assert.equal(
      first.aggregate.status,
      SETTLEMENT_SOURCE_STATUS.ACTIVE,
    );

    assert.equal(
      first.aggregate.kind,
      SETTLEMENT_SOURCE_KIND.EVM_ACCOUNT,
    );

    assert.equal(
      first.aggregate.metadata.version,
      1,
    );

    assert.equal(
      first.aggregate.coordinates.chainId,
      1,
    );

    assert.equal(
      first.aggregate.coordinates.network,
      "ethereum-mainnet",
    );

    assert.equal(
      first.aggregate.coordinates.address,
      getAddress(treasuryAddress),
    );

    const replay =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          registerSettlementSourceIdempotentlyWithClient({
            request,

            client: tx,
          }),
      );

    assert.equal(
      replay.disposition,
      "REPLAYED",
    );

    assert.equal(
      replay.aggregate.id,
      first.aggregate.id,
    );

    assert.equal(
      replay.aggregate.coordinates.address,
      first.aggregate.coordinates.address,
    );

    const loaded =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          loadSettlementSourceWithClient({
            settlementSourceId,

            client: tx,
          }),
      );

    assert(loaded);

    assert.equal(
      loaded.aggregate.id,
      settlementSourceId,
    );

    assert.equal(
      loaded.aggregate.reference,
      request.reference,
    );

    assert.equal(
      loaded.aggregate.status,
      SETTLEMENT_SOURCE_STATUS.ACTIVE,
    );

    assert.equal(
      loaded.aggregate.coordinates.address,
      getAddress(treasuryAddress),
    );

    await assert.rejects(
      prisma.$transaction(
        async (tx: TransactionClient) =>
          registerSettlementSourceIdempotentlyWithClient({
            request: {
              ...request,

              payload: {
                coordinates: {
                  ...request.payload.coordinates,

                  address:
                    changedAddress,
                },
              },
            },

            client: tx,
          }),
      ),

      /TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION/,
    );

    await assert.rejects(
      prisma.$transaction(
        async (tx: TransactionClient) =>
          registerSettlementSourceIdempotentlyWithClient({
            request: {
              ...request,

              payload: {
                coordinates: {
                  ...request.payload.coordinates,

                  chainId: 11155111,
                },
              },
            },

            client: tx,
          }),
      ),

      /TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION/,
    );

    console.log(
      "✓ Settlement Source idempotent registration smoke test passed",
    );

    console.log({
      source: {
        id:
          first.aggregate.id,

        status:
          first.aggregate.status,

        kind:
          first.aggregate.kind,

        chainId:
          first.aggregate.coordinates.chainId,

        network:
          first.aggregate.coordinates.network,

        address:
          first.aggregate.coordinates.address,
      },

      authority: {
        activeOnRegistration:
          first.aggregate.status ===
          SETTLEMENT_SOURCE_STATUS.ACTIVE,

        addressChecksumNormalized:
          first.aggregate.coordinates.address ===
          getAddress(treasuryAddress),

        immutableCoordinatesPersisted:
          true,

        replayRecoveredCanonicalAggregate:
          replay.aggregate.id ===
          first.aggregate.id,

        changedAddressRejectedUnderSameIdempotencyKey:
          true,

        changedChainRejectedUnderSameIdempotencyKey:
          true,

        containsNoSignerMaterial:
          true,
      },
    });
  } finally {
    await cleanup();

    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);

  try {
    await cleanup();
  } finally {
    await prisma.$disconnect();
  }

  process.exit(1);
});
