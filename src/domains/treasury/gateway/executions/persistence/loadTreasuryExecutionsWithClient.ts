import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import { decodeTreasuryExecutionSnapshot } from "./decodeTreasuryExecutionSnapshot";

import type { LoadedTreasuryExecution } from "./contracts";

type TreasuryGatewayExecutionRow = Readonly<{
  aggregateId: string;

  version: number;

  status: string;

  snapshot: unknown;
}>;

export async function loadTreasuryExecutionsWithClient(params: {
  executionIds: readonly TreasuryExecutionId[];

  client: TransactionClient;
}): Promise<readonly LoadedTreasuryExecution[]> {
  const { executionIds, client } = params;

  const uniqueExecutionIds = new Set(executionIds);

  if (uniqueExecutionIds.size !== executionIds.length) {
    throw new Error("[TREASURY_GATEWAY_EXECUTION_BATCH_DUPLICATE_ID]");
  }

  if (executionIds.length === 0) {
    return [];
  }

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: {
        in: [...executionIds],
      },
    },
  });

  const loadedAt = new Date();

  const loadedById = new Map<TreasuryExecutionId, LoadedTreasuryExecution>();

  for (const row of rows as readonly TreasuryGatewayExecutionRow[]) {
    const aggregate = decodeTreasuryExecutionSnapshot(row.snapshot);

    if (aggregate.id !== row.aggregateId) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
      );
    }

    if (aggregate.metadata.version !== row.version) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
      );
    }

    if (aggregate.status !== row.status) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
      );
    }

    if (!uniqueExecutionIds.has(aggregate.id)) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_BATCH_UNEXPECTED_EXECUTION] ${aggregate.id}`,
      );
    }

    if (loadedById.has(aggregate.id)) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_BATCH_DUPLICATE_RESULT] ${aggregate.id}`,
      );
    }

    loadedById.set(aggregate.id, {
      aggregate,

      loadedAt,
    });
  }

  const missingExecutionIds = executionIds.filter(
    (executionId) => !loadedById.has(executionId),
  );

  if (missingExecutionIds.length > 0) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_BATCH_NOT_FOUND] ${missingExecutionIds.join(",")}`,
    );
  }

  return executionIds.map((executionId) => {
    const loaded = loadedById.get(executionId);

    if (!loaded) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_BATCH_NOT_FOUND] ${executionId}`,
      );
    }

    return loaded;
  });
}
