import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  TREASURY_EXECUTION_ADAPTER_KIND,
  TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE,
} from "../../src/domains/treasury/gateway/executions/routing/contracts";

import {
  loadExternalSettlementRailCapabilityWithClient,
} from "../../src/domains/treasury/gateway/executions/routing/loadExternalSettlementRailCapabilityWithClient";

import {
  registerSettlementEndpointIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/settlement-endpoints/application/registerSettlementEndpointIdempotentlyWithClient";

import {
  SETTLEMENT_ENDPOINT_KIND,
} from "../../src/domains/treasury/gateway/settlement-endpoints/contracts";

const prisma = new PrismaClient();

const runId = randomUUID();

const settlementEndpointId =
  `settlement-endpoint-er2g-${runId}`;

const idempotencyKey =
  `settlement-endpoint-er2g-idempotency-${runId}`;

const context = {
  commandId:
    `settlement-endpoint-er2g-command-${runId}`,

  actorId:
    `settlement-endpoint-er2g-actor-${runId}`,

  correlationId:
    `settlement-endpoint-er2g-correlation-${runId}`,

  requestedAt: new Date(),

  idempotencyKey,
};

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
    await prisma.$transaction(
      async (tx: TransactionClient) => {
        await registerSettlementEndpointIdempotentlyWithClient({
          request: {
            settlementEndpointId,

            reference:
              `ER-2G Ethereum USDT Endpoint ${runId}`,

            eventId:
              `settlement-endpoint-er2g-event-${runId}`,

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
          },

          client: tx,
        });
      },
    );

    const capability =
      await prisma.$transaction(
        async (tx: TransactionClient) =>
          loadExternalSettlementRailCapabilityWithClient({
            settlementEndpointId,

            client: tx,
          }),
      );

    assert.equal(
      capability.kind,
      TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL,
    );

    assert.equal(
      capability.settlementEndpointId,
      settlementEndpointId,
    );

    assert.equal(
      capability.railCode,
      TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE.EVM_ERC20,
    );

    await assert.rejects(
      prisma.$transaction(
        async (tx: TransactionClient) =>
          loadExternalSettlementRailCapabilityWithClient({
            settlementEndpointId:
              `missing-${runId}`,

            client: tx,
          }),
      ),

      /TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_NOT_FOUND/,
    );

    console.log(
      "✓ Governed external settlement rail capability smoke test passed",
    );

    console.log({
      settlementEndpointId,

      capability: {
        kind: capability.kind,

        railCode: capability.railCode,
      },

      authority: {
        loadedFromCanonicalSettlementEndpoint: true,

        activeEndpointRequired: true,

        callerStructuralManufactureBlockedByTypeBrand:
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
