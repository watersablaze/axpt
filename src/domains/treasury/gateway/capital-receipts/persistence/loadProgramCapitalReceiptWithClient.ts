import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { ProgramCapitalReceiptId } from "../../shared/identifiers";

import { decodeProgramCapitalReceiptSnapshot } from "./decodeProgramCapitalReceiptSnapshot";

import type { LoadedProgramCapitalReceipt } from "./contracts";

export async function loadProgramCapitalReceiptWithClient(params: {
  receiptId: ProgramCapitalReceiptId;

  client: TransactionClient;
}): Promise<LoadedProgramCapitalReceipt | null> {
  const { receiptId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

        aggregateId: receiptId,
      },
    },
  });

  if (!row) {
    return null;
  }

  const aggregate = decodeProgramCapitalReceiptSnapshot(row.snapshot);

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (aggregate.metadata.version !== row.version) {
    throw new Error(
      `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (aggregate.status !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_STATUS_MISMATCH] ${aggregate.status} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
