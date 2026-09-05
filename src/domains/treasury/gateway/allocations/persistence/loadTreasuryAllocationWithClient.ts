import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryAllocationId } from "../../shared/identifiers";

import { decodeTreasuryAllocationSnapshot } from "./decodeTreasuryAllocationSnapshot";

import type { LoadedTreasuryAllocation } from "./contracts";

export async function loadTreasuryAllocationWithClient(params: {
  allocationId: TreasuryAllocationId;

  client: TransactionClient;
}): Promise<LoadedTreasuryAllocation | null> {
  const { allocationId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

        aggregateId: allocationId,
      },
    },
  });

  if (!row) {
    return null;
  }

  const aggregate = decodeTreasuryAllocationSnapshot(row.snapshot);

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (aggregate.metadata.version !== row.version) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (aggregate.status !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
