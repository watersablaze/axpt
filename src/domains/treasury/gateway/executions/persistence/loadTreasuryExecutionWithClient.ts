import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { decodeTreasuryExecutionSnapshot } from "./decodeTreasuryExecutionSnapshot";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import type { LoadedTreasuryExecution } from "./contracts";

export async function loadTreasuryExecutionWithClient(params: {
  executionId: TreasuryExecutionId;

  client: TransactionClient;
}): Promise<LoadedTreasuryExecution | null> {
  const { executionId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    },
  });

  if (!row) {
    return null;
  }

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

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
