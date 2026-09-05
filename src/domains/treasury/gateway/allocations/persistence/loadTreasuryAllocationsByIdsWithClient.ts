import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryAllocationId } from "../../shared/identifiers";

import type { TreasuryAllocation } from "../contracts";

import { decodeTreasuryAllocationSnapshot } from "./decodeTreasuryAllocationSnapshot";

export async function loadTreasuryAllocationsByIdsWithClient(params: {
  allocationIds: readonly TreasuryAllocationId[];

  client: TransactionClient;
}): Promise<readonly TreasuryAllocation[]> {
  const { allocationIds, client } = params;

  const uniqueAllocationIds = new Set(allocationIds);

  if (uniqueAllocationIds.size !== allocationIds.length) {
    throw new Error("[TREASURY_GATEWAY_ALLOCATION_BATCH_DUPLICATE_ID]");
  }

  if (allocationIds.length === 0) {
    return [];
  }

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

      aggregateId: {
        in: [...allocationIds],
      },
    },
  });

  const allocationsById = new Map<TreasuryAllocationId, TreasuryAllocation>();

  for (const row of rows) {
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

    if (!uniqueAllocationIds.has(aggregate.id)) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_BATCH_UNEXPECTED_ALLOCATION] ${aggregate.id}`,
      );
    }

    if (allocationsById.has(aggregate.id)) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_BATCH_DUPLICATE_RESULT] ${aggregate.id}`,
      );
    }

    allocationsById.set(aggregate.id, aggregate);
  }

  const missingAllocationIds = allocationIds.filter(
    (allocationId) => !allocationsById.has(allocationId),
  );

  if (missingAllocationIds.length > 0) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_BATCH_NOT_FOUND] ${missingAllocationIds.join(",")}`,
    );
  }

  return allocationIds.map((allocationId) => {
    const allocation = allocationsById.get(allocationId);

    if (!allocation) {
      throw new Error(
        `[TREASURY_GATEWAY_ALLOCATION_BATCH_NOT_FOUND] ${allocationId}`,
      );
    }

    return allocation;
  });
}
