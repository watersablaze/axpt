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
  registerSettlementEndpointIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/settlement-endpoints/application/registerSettlementEndpointIdempotentlyWithClient";

import {
  SETTLEMENT_ENDPOINT_KIND,
} from "../../src/domains/treasury/gateway/settlement-endpoints/contracts";

import {
  loadSettlementEndpointWithClient,
} from "../../src/domains/treasury/gateway/settlement-endpoints/persistence/loadSettlementEndpointWithClient";

import {
  SETTLEMENT_ENDPOINT_STATUS,
} from "../../src/domains/treasury/gateway/settlement-endpoints/status";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

const prisma = new PrismaClient();

const runId = randomUUID();

const settlementEndpointId =
  `settlement-endpoint-er2f-${runId}`;

const idempotencyKey =
  `settlement-endpoint-er2f-idempotency-${runId}`;

const eventId =
  `settlement-endpoint-er2f-event-${runId}`;

const context = {
  commandId:
    `settlement-endpoint-er2f-command-${runId}`,

  actorId:
    `settlement-endpoint-er2f-actor-${runId}`,

  correlationId:
    `settlement-endpoint-er2f-correlation-${runId}`,

  requestedAt: new Date(),

  idempotencyKey,
};

const request = {
  settlementEndpointId,

  reference:
    `Ethereum Mainnet USDT Operations ${runId}`,

  eventId,

  context,

  payload: {
    coordinates: {
      kind:
        SETTLEMENT_ENDPOINT_KIND.EVM_ERC20,

      chainId: 1,

      network: "ethereum-mainnet",

      address:
        "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",

      assetCode: "USDT",

      tokenContractAddress:
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",

      tokenDecimals: 6,
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
            TREASURY_AGGREGATE_TYPE.SETTLEMENT_ENDPOINT,

          aggregateId:
            settlementEndpointId,
        },
      });

      await tx.treasuryGatewayAggregate.deleteMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.SETTLEMENT_ENDPOINT,

          aggregateId:
            settlementEndpointId,
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
          registerSettlementEndpointIdempotentlyWithClient({
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
      settlementEndpointId,
    );

    assert.equal(
      first.aggregate.status,
      SETTLEMENT_ENDPOINT_STATUS.ACTIVE,
    );

    assert.equal(
      first.aggregate.kind,
      SETTLEMENT_ENDPOINT_KIND.EVM_ERC20,
    );

    assert.equal(
      first.aggregate.coordinates.chainId,
      1,
    );

    assert.equal(
      first.aggregate.coordinates.assetCode,
      "USDT",
    );

    assert.equal(
      first.aggregate.coordinates.tokenDecimals,
      6,
    );

    assert.equal(
      first.aggregate.coordinates.address,
      getAddress(
        "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",
      ),
    );

    assert.equal(
      first.aggregate.coordinates.tokenContractAddress,
      getAddress(
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      ),
    );

    const replay =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          registerSettlementEndpointIdempotentlyWithClient({
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

    const loaded =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          loadSettlementEndpointWithClient({
            settlementEndpointId,

            client: tx,
          }),
      );

    assert(loaded);

    assert.equal(
      loaded.aggregate.reference,
      request.reference,
    );

    assert.equal(
      loaded.aggregate.coordinates.network,
      "ethereum-mainnet",
    );

    await assert.rejects(
      prisma.$transaction(
        async (tx: TransactionClient) =>
          registerSettlementEndpointIdempotentlyWithClient({
            request: {
              ...request,

              payload: {
                coordinates: {
                  ...request.payload.coordinates,

                  address:
                    "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F",
                },
              },
            },

            client: tx,
          }),
      ),

      /TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION/,
    );

    console.log(
      "✓ Settlement Endpoint idempotent registration smoke test passed",
    );

    console.log({
      endpoint: {
        id: first.aggregate.id,

        status: first.aggregate.status,

        kind: first.aggregate.kind,

        chainId:
          first.aggregate.coordinates.chainId,

        network:
          first.aggregate.coordinates.network,

        assetCode:
          first.aggregate.coordinates.assetCode,

        tokenDecimals:
          first.aggregate.coordinates.tokenDecimals,
      },

      authority: {
        immutableCoordinatesPersisted: true,

        replayRecoveredCanonicalAggregate: true,

        changedCoordinatesRejectedUnderSameIdempotencyKey:
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
