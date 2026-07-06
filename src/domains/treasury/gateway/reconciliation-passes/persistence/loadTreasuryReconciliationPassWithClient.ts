import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { decodeTreasuryReconciliationPassSnapshot } from "./decodeTreasuryReconciliationPassSnapshot";

import type { LoadedTreasuryReconciliationPass } from "./contracts";

export async function loadTreasuryReconciliationPassWithClient(params: {
  passId: string;

  client: TransactionClient;
}): Promise<LoadedTreasuryReconciliationPass | null> {
  const { passId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

        aggregateId: passId,
      },
    },
  });

  if (!row) {
    return null;
  }

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

    loadedAt: new Date(),
  };
}
