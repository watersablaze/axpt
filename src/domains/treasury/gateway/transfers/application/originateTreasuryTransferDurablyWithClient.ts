import type { TransactionClient } from "@prisma/client";

import { createTreasuryTransfer } from "../createTreasuryTransfer";

import { persistNewTreasuryTransferWithClient } from "../persistence/persistNewTreasuryTransferWithClient";

import type { PersistedNewTreasuryTransfer } from "../persistence/contracts";

import type { OriginateTreasuryTransferDurably } from "./originateTreasuryTransferDurablyContracts";

export async function originateTreasuryTransferDurablyWithClient(params: {
  request: OriginateTreasuryTransferDurably;

  client: TransactionClient;
}): Promise<PersistedNewTreasuryTransfer> {
  const { request, client } = params;

  const result = createTreasuryTransfer({
    transferId: request.transferId,

    reference: request.reference,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewTreasuryTransferWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
