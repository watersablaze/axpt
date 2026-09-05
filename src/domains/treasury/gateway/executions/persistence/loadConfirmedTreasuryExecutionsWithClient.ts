import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { CurrencyCode } from "../../shared/money";

import type { TreasuryExecution } from "../contracts";

import { TREASURY_EXECUTION_STATUS } from "../status";

import { decodeTreasuryExecutionSnapshot } from "./decodeTreasuryExecutionSnapshot";

export async function loadConfirmedTreasuryExecutionsWithClient(params: {
  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<readonly TreasuryExecution[]> {
  const { currency, client } = params;

  const rows = await client.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      status: TREASURY_EXECUTION_STATUS.CONFIRMED,
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  const executions: TreasuryExecution[] = [];

  for (const row of rows) {
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

    if (aggregate.amount.currency !== currency) {
      continue;
    }

    executions.push(aggregate);
  }

  return executions;
}
