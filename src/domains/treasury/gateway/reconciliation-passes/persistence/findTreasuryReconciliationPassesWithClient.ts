import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { decodeTreasuryReconciliationPassSnapshot } from "./decodeTreasuryReconciliationPassSnapshot";

import type { LoadedTreasuryReconciliationPass } from "./contracts";

type TreasuryGatewayReconciliationPassRow = Readonly<{
  aggregateId: string;

  version: number;

  status: string;

  snapshot: unknown;
}>;

export async function findTreasuryReconciliationPassesWithClient(params: {
  limit: number;

  client: TransactionClient;
}): Promise<readonly LoadedTreasuryReconciliationPass[]> {
  const { limit, client } = params;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_LIST_LIMIT_INVALID] ${limit}`,
    );
  }

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,
    },

    orderBy: [
      {
        updatedAt: "desc",
      },

      {
        aggregateId: "asc",
      },
    ],

    take: limit,
  });

  const loadedAt = new Date();

  return rows.map((row: TreasuryGatewayReconciliationPassRow) => {
    const aggregate = decodeTreasuryReconciliationPassSnapshot(row.snapshot);

    if (aggregate.id !== row.aggregateId) {
      throw new Error(
        `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
      );
    }

    if (aggregate.metadata.version !== row.version) {
      throw new Error(
        `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
      );
    }

    if (aggregate.status !== row.status) {
      throw new Error(
        `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
      );
    }

    return {
      aggregate,

      loadedAt,
    };
  });
}
