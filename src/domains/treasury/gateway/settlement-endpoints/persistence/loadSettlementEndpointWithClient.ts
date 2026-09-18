import type {
  TransactionClient,
} from "@prisma/client";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../events/aggregateTypes";

import type {
  SettlementEndpointId,
} from "../../shared/identifiers";

import {
  decodeSettlementEndpointSnapshot,
} from "./decodeSettlementEndpointSnapshot";

import type {
  LoadedSettlementEndpoint,
} from "./contracts";

export async function loadSettlementEndpointWithClient(
  params: {
    settlementEndpointId: SettlementEndpointId;

    client: TransactionClient;
  },
): Promise<LoadedSettlementEndpoint | null> {
  const {
    settlementEndpointId,
    client,
  } = params;

  const row =
    await client.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.SETTLEMENT_ENDPOINT,

          aggregateId: settlementEndpointId,
        },
      },
    });

  if (!row) {
    return null;
  }

  const aggregate =
    decodeSettlementEndpointSnapshot(
      row.snapshot,
    );

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (
    aggregate.metadata.version !== row.version
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (aggregate.status !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
