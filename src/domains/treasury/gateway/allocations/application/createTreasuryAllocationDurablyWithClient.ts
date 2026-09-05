import type { TransactionClient } from "@prisma/client";

import { createTreasuryAllocation } from "../createTreasuryAllocation";

import { persistNewTreasuryAllocationWithClient } from "../persistence/persistNewTreasuryAllocationWithClient";

import type { PersistedNewTreasuryAllocation } from "../persistence/contracts";

import type { CreateTreasuryAllocationDurably } from "./createTreasuryAllocationDurablyContracts";

export async function createTreasuryAllocationDurablyWithClient(params: {
  request: CreateTreasuryAllocationDurably;

  client: TransactionClient;
}): Promise<PersistedNewTreasuryAllocation> {
  const { request, client } = params;

  const result = createTreasuryAllocation({
    allocationId: request.allocationId,

    reference: request.reference,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewTreasuryAllocationWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
