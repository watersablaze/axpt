import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryExecutionPlanId } from "../../shared/identifiers";

import { decodeTreasuryExecutionPlanSnapshot } from "./decodeTreasuryExecutionPlanSnapshot";

import type { LoadedTreasuryExecutionPlan } from "./contracts";

export async function loadTreasuryExecutionPlanWithClient(params: {
  planId: TreasuryExecutionPlanId;

  client: TransactionClient;
}): Promise<LoadedTreasuryExecutionPlan | null> {
  const { planId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    },
  });

  if (!row) {
    return null;
  }

  const aggregate = decodeTreasuryExecutionPlanSnapshot(row.snapshot);

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (aggregate.metadata.version !== row.version) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (aggregate.status !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
