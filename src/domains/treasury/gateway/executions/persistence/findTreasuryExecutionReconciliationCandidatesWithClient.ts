import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EXECUTION_STATUS } from "../status";

import { decodeTreasuryExecutionSnapshot } from "./decodeTreasuryExecutionSnapshot";

import type { LoadedTreasuryExecution } from "./contracts";

const RECONCILABLE_EXECUTION_STATUSES = [
  TREASURY_EXECUTION_STATUS.QUEUED,
  TREASURY_EXECUTION_STATUS.INITIATED,
] as const;

type TreasuryGatewayExecutionCandidateRow = Readonly<{
  aggregateId: string;

  version: number;

  status: string;

  snapshot: unknown;
}>;

export async function findTreasuryExecutionReconciliationCandidatesWithClient(params: {
  limit: number;

  client: TransactionClient;
}): Promise<readonly LoadedTreasuryExecution[]> {
  const { limit, client } = params;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_RECONCILIATION_CANDIDATE_LIMIT_INVALID] ${limit}`,
    );
  }

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      status: {
        in: [...RECONCILABLE_EXECUTION_STATUSES],
      },
    },

    orderBy: [
      {
        updatedAt: "asc",
      },

      {
        aggregateId: "asc",
      },
    ],

    take: limit,
  });

  const loadedAt = new Date();

  return rows.map((row: TreasuryGatewayExecutionCandidateRow) => {
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

      loadedAt,
    };
  });
}
