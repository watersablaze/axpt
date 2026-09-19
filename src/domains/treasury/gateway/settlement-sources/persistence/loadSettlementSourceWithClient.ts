import type {
  TransactionClient,
} from "@prisma/client";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../events/aggregateTypes";

import type {
  SettlementSourceId,
} from "../../shared/identifiers";

import {
  decodeSettlementSourceSnapshot,
} from "./decodeSettlementSourceSnapshot";

import type {
  LoadedSettlementSource,
} from "./contracts";

export async function loadSettlementSourceWithClient(
  params: {
    settlementSourceId:
      SettlementSourceId;

    client: TransactionClient;
  },
): Promise<
  LoadedSettlementSource | null
> {
  const {
    settlementSourceId,
    client,
  } = params;

  const row =
    await client.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.SETTLEMENT_SOURCE,

          aggregateId:
            settlementSourceId,
        },
      },
    });

  if (!row) {
    return null;
  }

  const aggregate =
    decodeSettlementSourceSnapshot(
      row.snapshot,
    );

  if (
    aggregate.id !==
    row.aggregateId
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (
    aggregate.metadata.version !==
    row.version
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (
    aggregate.status !==
    row.status
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
