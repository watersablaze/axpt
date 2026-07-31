import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type {
  TreasuryEventId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryTransfer } from "../contracts";

import type { PersistedTreasuryTransferTransition } from "../persistence/contracts";

import { loadTreasuryTransferWithClient } from "../persistence/loadTreasuryTransferWithClient";

import { persistTreasuryTransferTransitionWithClient } from "../persistence/persistTreasuryTransferTransitionWithClient";

export async function executeDurableTreasuryTransferTransitionWithClient<
  TPayload,
>(params: {
  transferId: TreasuryTransferId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  apply: (
    aggregate: TreasuryTransfer,
  ) => TreasuryDomainResult<TreasuryTransfer, TPayload>;

  client: TransactionClient;
}): Promise<PersistedTreasuryTransferTransition<TPayload>> {
  const { transferId, eventId, context, apply, client } = params;

  const loaded = await loadTreasuryTransferWithClient({
    transferId,

    client,
  });

  if (!loaded) {
    throw new Error(`[TREASURY_GATEWAY_TRANSFER_NOT_FOUND] ${transferId}`);
  }

  const result = apply(loaded.aggregate);

  return persistTreasuryTransferTransitionWithClient({
    expectedVersion: loaded.aggregate.metadata.version,

    result,

    eventId,

    context,

    client,
  });
}
