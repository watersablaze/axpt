import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TreasuryTransferId } from "../../shared/identifiers";

import type { LoadedTreasuryTransfer } from "./contracts";

import { decodeTreasuryTransferSnapshot } from "./decodeTreasuryTransferSnapshot";

export async function loadTreasuryTransferWithClient(params: {
  transferId: TreasuryTransferId;

  client: TransactionClient;
}): Promise<LoadedTreasuryTransfer | null> {
  const { transferId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    },
  });

  if (!row) {
    return null;
  }

  const aggregate = decodeTreasuryTransferSnapshot(row.snapshot);

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (aggregate.metadata.version !== row.version) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (aggregate.status !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
