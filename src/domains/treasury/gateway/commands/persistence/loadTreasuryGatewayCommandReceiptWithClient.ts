import type { TransactionClient } from "@prisma/client";

import type { TreasuryIdempotencyKey } from "../../shared/identifiers";

import type { TreasuryGatewayCommandReceipt } from "./contracts";

export async function loadTreasuryGatewayCommandReceiptWithClient(params: {
  idempotencyKey: TreasuryIdempotencyKey;

  client: TransactionClient;
}): Promise<TreasuryGatewayCommandReceipt | null> {
  const { idempotencyKey, client } = params;

  const row = await client.treasuryGatewayCommandReceipt.findUnique({
    where: {
      idempotencyKey,
    },
  });

  if (!row) {
    return null;
  }

  return {
    idempotencyKey: row.idempotencyKey,

    commandId: row.commandId,

    commandKind: row.commandKind,

    aggregateType:
      row.aggregateType as TreasuryGatewayCommandReceipt["aggregateType"],

    aggregateId: row.aggregateId,

    actorId: row.actorId,

    correlationId: row.correlationId,

    requestFingerprint: row.requestFingerprint,

    createdAt: row.createdAt,
  };
}
